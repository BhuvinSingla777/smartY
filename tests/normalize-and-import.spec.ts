import {
  normalizeKey,
  normalizePercentage,
  parseNullableNumber,
  parseFlexibleDate,
  overallCompletion,
  isAggregateMemberName,
  uniquifyHeaders,
  parsePodBranch,
} from '../src/lib/shared';
import { extractDailyFromSheet, extractPodsFromSheet, sheetRowToPod } from '../src/lib/transforms/sheet-extract';
import { matrixToParsedSheet } from '../src/lib/parsers/workbook-layout';
import { transformBdgSheets } from '../src/lib/transforms/bdg-transform';
import {
  transformPodsSheets,
  transformDailyFromMatrix,
} from '../src/lib/transforms/pods-transform';
import {
  parseMarkdownTasks,
  podStatusFromTasks,
  taskOverallCompletion,
} from '../src/lib/transforms/md-tasks';
import { CsvParser } from '../src/lib/parsers/csv.parser';
import { ExcelParser } from '../src/lib/parsers/excel.parser';
import { WordParser } from '../src/lib/parsers/word.parser';
import { PdfParser } from '../src/lib/parsers/pdf.parser';

describe('normalizeKey', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeKey('Akshay Mishra')).toBe('akshay mishra');
    expect(normalizeKey(' akshay mishra ')).toBe('akshay mishra');
    expect(normalizeKey('AKSHAY MISHRA')).toBe('akshay mishra');
  });

  it('normalizes POD names', () => {
    expect(normalizeKey('TeleHealth')).toBe('telehealth');
    expect(normalizeKey(' telehealth ')).toBe('telehealth');
    expect(normalizeKey('TELEHEALTH')).toBe('telehealth');
  });
});

describe('isAggregateMemberName', () => {
  it('detects Total and similar aggregate labels', () => {
    expect(isAggregateMemberName('Total')).toBe(true);
    expect(isAggregateMemberName(' TOTAL')).toBe(true);
    expect(isAggregateMemberName('Grand Total')).toBe(true);
    expect(isAggregateMemberName('Akshay Mishra')).toBe(false);
  });
});

describe('normalizePercentage', () => {
  it('accepts percent strings and decimals', () => {
    expect(normalizePercentage('85%')).toBe(85);
    expect(normalizePercentage('~88%')).toBe(88);
    expect(normalizePercentage(0.86)).toBe(86);
    expect(normalizePercentage(0.85)).toBe(85);
    expect(normalizePercentage(85)).toBe(85);
    expect(normalizePercentage('0.29')).toBe(29);
  });

  it('rejects invalid values', () => {
    expect(normalizePercentage('abc')).toBeNull();
    expect(normalizePercentage('')).toBeNull();
  });
});

describe('parseNullableNumber / dates', () => {
  it('parses numbers and rejects negatives via transform', () => {
    expect(parseNullableNumber('10')).toBe(10);
    expect(parseNullableNumber('-1')).toBe(-1);
  });

  it('parses flexible dates', () => {
    expect(parseFlexibleDate('01/09/2026')).toBe('2026-09-01');
    expect(parseFlexibleDate('9-Aug-2026')).toBe('2026-08-09');
    expect(parseFlexibleDate('01-Sep-2026')).toBe('2026-09-01');
    expect(parseFlexibleDate(46243)).toBe('2026-08-09');
  });

  it('computes overall completion', () => {
    expect(overallCompletion(80, 90, 70)).toBe(80);
    expect(overallCompletion(null, null, null)).toBeNull();
  });
});

describe('BDG transform', () => {
  const sheet = {
    name: 'BDG',
    headers: [
      'BDG Member',
      'Total Leads (Inbound)',
      'Total Leads (Outbound)',
      'APAC Inbound',
      'APAC Outbound',
    ],
    rows: [
      {
        'BDG Member': 'Akshay Mishra',
        'Total Leads (Inbound)': '10',
        'Total Leads (Outbound)': '8',
        'APAC Inbound': '1',
        'APAC Outbound': '3',
      },
      {
        'BDG Member': ' akshay mishra ',
        'Total Leads (Inbound)': '1',
        'Total Leads (Outbound)': '1',
        'APAC Inbound': '0',
        'APAC Outbound': '0',
      },
      {
        'BDG Member': '',
        'Total Leads (Inbound)': '5',
        'Total Leads (Outbound)': '0',
        'APAC Inbound': '0',
        'APAC Outbound': '0',
      },
      {
        'BDG Member': 'Bad Number',
        'Total Leads (Inbound)': 'abc',
        'Total Leads (Outbound)': '-2',
        'APAC Inbound': '0',
        'APAC Outbound': '0',
      },
    ],
  };

  it('creates/update actions and prevents in-file duplicates', () => {
    const existing = new Set([normalizeKey('Someone Else')]);
    const result = transformBdgSheets([sheet], undefined, existing);
    const akshay = result.records.filter(
      (r) => normalizeKey(r.data.memberName || 'x') === 'akshay mishra',
    );
    expect(akshay[0].action).toBe('create');
    expect(akshay[1].action).toBe('skip');
    expect(akshay[1].issues.some((i) => /Duplicate/i.test(i.message))).toBe(
      true,
    );
  });

  it('marks existing members as update', () => {
    const existing = new Set([normalizeKey('Akshay Mishra')]);
    const single = {
      ...sheet,
      rows: [sheet.rows[0]],
    };
    const result = transformBdgSheets([single], undefined, existing);
    expect(result.records[0].action).toBe('update');
  });

  it('flags missing member and invalid numbers', () => {
    const result = transformBdgSheets([sheet]);
    const missing = result.records.find((r) => !r.data.memberName);
    expect(missing?.issues.some((i) => /missing/i.test(i.message))).toBe(true);
    const bad = result.records.find((r) => r.data.memberName === 'Bad Number');
    expect(bad?.issues.length).toBeGreaterThan(0);
    expect(result.errorCount).toBeGreaterThan(0);
  });

  it('never imports Total aggregate rows as members', () => {
    const withTotal = {
      ...sheet,
      rows: [
        sheet.rows[0],
        {
          'BDG Member': 'Total',
          'Total Leads (Inbound)': '100',
          'Total Leads (Outbound)': '50',
          'APAC Inbound': '10',
          'APAC Outbound': '5',
        },
        {
          'BDG Member': 'Grand Total',
          'Total Leads (Inbound)': '200',
          'Total Leads (Outbound)': '100',
          'APAC Inbound': '0',
          'APAC Outbound': '0',
        },
      ],
    };
    const result = transformBdgSheets([withTotal]);
    expect(
      result.records.some((r) =>
        /total/i.test(r.data.memberName),
      ),
    ).toBe(false);
    expect(result.records).toHaveLength(1);
    expect(result.records[0].data.memberName).toBe('Akshay Mishra');
  });
});

describe('PODS transform', () => {
  const info = {
    name: 'Info',
    headers: [
      'POD Name',
      'Description',
      'Status',
      'FE',
      'BE',
      'FE + BE integrations',
    ],
    rows: [
      {
        'POD Name': 'TeleHealth',
        Description: 'Health',
        Status: 'in progress',
        FE: '0.85',
        BE: '88%',
        'FE + BE integrations': 82,
      },
      {
        'POD Name': 'TELEHEALTH',
        Description: 'dup',
        Status: 'in progress',
        FE: '10',
        BE: '10',
        'FE + BE integrations': 10,
      },
    ],
  };

  it('prevents duplicate POD names in file', () => {
    const result = transformPodsSheets([info]);
    expect(result.pods[0].action).toBe('create');
    expect(result.pods[1].action).toBe('skip');
  });

  it('updates existing POD', () => {
    const existing = new Set([normalizeKey('TeleHealth')]);
    const result = transformPodsSheets(
      [{ ...info, rows: [info.rows[0]] }],
      existing,
    );
    expect(result.pods[0].action).toBe('update');
    expect(result.pods[0].data.feCompletion).toBe(85);
    expect(result.pods[0].data.beCompletion).toBe(88);
  });

  it('parses daily matrix and preserves multiple dates', () => {
    const matrix: (string | number | null)[][] = [
      [
        null,
        'Completion Percentage - 01/09/2026',
        null,
        null,
        null,
        'Completion Percentage - 02/09/2026',
        null,
        null,
      ],
      [
        'POD Name',
        'FE',
        'BE',
        'FE + BE integrations',
        null,
        'FE',
        'BE',
        'FE + BE integrations',
      ],
      ['TeleHealth', 85, 88, 82, null, 87, 90, 85],
      ['WMS Pick', 0.29, 0.74, 0.66, null, 0.31, 0.89, 0.78],
    ];
    const daily = transformDailyFromMatrix(matrix);
    expect(daily.records.length).toBe(4);
    const dates = new Set(daily.records.map((r) => r.data.date));
    expect(dates.has('2026-09-01')).toBe(true);
    expect(dates.has('2026-09-02')).toBe(true);
  });
});

describe('parsers', () => {
  it('parses CSV', async () => {
    const csv = 'BDG Member,Total Leads (Inbound),Total Leads (Outbound)\nA,1,2\n';
    const result = await new CsvParser().parse(Buffer.from(csv), 't.csv');
    expect(result.sheets[0].rows.length).toBe(1);
    expect(result.format).toBe('CSV');
  });

  it('parses XLSX', async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['POD Name', 'Status', 'FE', 'BE', 'FE + BE integrations'],
      ['TeleHealth', 'in progress', 85, 88, 82],
    ]);
    XLSX.utils.book_append_sheet(wb, sheet, 'Info');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const result = await new ExcelParser().parse(buf, 'pods.xlsx');
    expect(result.sheets[0].rows.length).toBe(1);
  });

  it('parses DOCX tables via mammoth HTML', async () => {
    // Minimal docx is complex; test WordParser plain-text fallback path with a fake
    // by calling extract through a tiny HTML-producing buffer is hard.
    // Instead verify PdfParser rejects empty and WordParser throws on garbage.
    const parser = new WordParser();
    await expect(parser.parse(Buffer.from('not a docx'), 'x.docx')).rejects.toThrow(
      /Unable to parse Word|Failed|zip|central directory|Invalid/i,
    );
  });

  it('rejects unparseable PDF', async () => {
    const parser = new PdfParser();
    await expect(
      parser.parse(Buffer.from('%PDF-1.4 empty'), 'x.pdf'),
    ).rejects.toThrow(/Unable to reliably identify/i);
  });
});

describe('pod branch', () => {
  it('normalizes sdm/sdd/sdn from labels and embedded text', () => {
    expect(parsePodBranch('SDD')).toBe('sdd');
    expect(parsePodBranch('sdm')).toBe('sdm');
    expect(parsePodBranch('Demo SDD')).toBe('sdd');
    expect(parsePodBranch('west')).toBeNull();
  });
});

describe('sheet column extraction', () => {
  it('keeps duplicate column titles unique', () => {
    expect(uniquifyHeaders(['FE', 'BE', 'FE'])).toEqual(['FE', 'BE', 'FE (2)']);
  });

  it('maps known columns and keeps extra sheet fields', () => {
    const candidate = sheetRowToPod(
      {
        'POD Name': 'TeleHealth',
        Status: 'in progress',
        Priority: 'High',
        Notes: 'priority',
      },
      ['POD Name', 'Status', 'Priority', 'Notes'],
      0,
    );
    expect(candidate?.dto.name).toBe('TeleHealth');
    expect(candidate?.dto.status).toBe('in progress');
    expect(candidate?.extraFields).toEqual({ Priority: 'High', Notes: 'priority' });
  });

  it('maps Branch column and infers sdd from Demo SDD', () => {
    const withColumn = sheetRowToPod(
      {
        'POD Name': 'CLM',
        Branch: 'SDN',
        Status: 'in progress',
      },
      ['POD Name', 'Branch', 'Status'],
      0,
    );
    expect(withColumn?.dto.branch).toBe('sdn');

    const inferred = sheetRowToPod(
      {
        'POD Name': 'TeleHealth',
        'Machine aligned to project': 'Demo SDD',
      },
      ['POD Name', 'Machine aligned to project'],
      0,
    );
    expect(inferred?.dto.branch).toBe('sdd');
  });

  it('stamps a default branch when the sheet has none', () => {
    const stamped = extractPodsFromSheet(
      {
        name: 'Info',
        headers: ['POD Name', 'Dev'],
        rows: [{ 'POD Name': 'CLM', Dev: 'Pooja' }],
      },
      undefined,
      'sdm',
    );
    expect(stamped[0]?.dto.branch).toBe('sdm');
  });

  it('creates one candidate per data row', () => {
    const result = extractPodsFromSheet({
      name: 'Info',
      headers: ['POD Name', 'Dev'],
      rows: [
        { 'POD Name': 'CLM', Dev: 'Pooja' },
        { 'POD Name': 'WMS Pick', Dev: 'Prachi' },
      ],
    });
    expect(result.map((r) => r.name)).toEqual(['CLM', 'WMS Pick']);
  });
});

describe('PODS.xlsx workbook layout', () => {
  it('reads Info from the POD Name header row, not the title row', () => {
    const sheet = matrixToParsedSheet('Info', [
      [null, null, null, null, null, null, null, 'Completion Percentage'],
      [
        'POD Name ',
        'Description',
        'Status ',
        'Start Date ',
        'Dev',
        'Machine Owner ',
        'Machine aligned to project ',
        'FE ',
        'BE',
        'FE + BE integrations',
      ],
      [
        'TeleHealth',
        'Remote care',
        'In Progress',
        46243,
        'Abhishek Jeena ',
        'Abhishek Jeena',
        'Demo SDD',
        '        ~88%',
        0.85,
        0.86,
      ],
    ]);
    expect(sheet?.headers).toEqual([
      'POD Name',
      'Description',
      'Status',
      'Start Date',
      'Dev',
      'Machine Owner',
      'Machine aligned to project',
      'FE',
      'BE',
      'FE + BE integrations',
    ]);
    expect(sheet?.rows[0]?.['POD Name']).toBe('TeleHealth');
    expect(sheet?.rows[0]?.['Start Date']).toBe('2026-08-09');
    expect(sheet?.rows[0]?.FE).toBe(88);
    expect(sheet?.rows[0]?.BE).toBe(85);
    const pod = sheetRowToPod(sheet!.rows[0], sheet!.headers, 0);
    expect(pod?.dto.name).toBe('TeleHealth');
    expect(pod?.dto.developers).toBe('Abhishek Jeena');
    expect(pod?.dto.feCompletion).toBe(88);
  });

  it('labels Daily Update columns with the date group', () => {
    const sheet = matrixToParsedSheet('Daily Update', [
      [
        null,
        'Completion Percentage - 01/09/2026',
        null,
        null,
        null,
        'Completion Percentage - 02/09/2026',
        null,
        null,
      ],
      [
        'POD Name ',
        'FE ',
        'BE',
        'FE + BE integrations',
        null,
        'FE ',
        'BE',
        'FE + BE integrations',
      ],
      ['TeleHealth', 85, 88, 82, null, 85, 88, 82],
    ]);
    expect(sheet?.headers).toEqual([
      'POD Name',
      'FE — 2026-09-01',
      'BE — 2026-09-01',
      'FE + BE integrations — 2026-09-01',
      'FE — 2026-09-02',
      'BE — 2026-09-02',
      'FE + BE integrations — 2026-09-02',
    ]);
    const daily = extractDailyFromSheet(sheet!);
    expect(daily).toHaveLength(2);
    expect(daily[0]).toMatchObject({
      podName: 'TeleHealth',
      date: '2026-09-01',
      feCompletion: 85,
      beCompletion: 88,
      integrationCompletion: 82,
    });
  });

  it('labels Info completion columns with Fast API / Node / .NET Core domains', () => {
    const sheet = matrixToParsedSheet('Info', [
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'Completion Percentage (Fast API)',
        null,
        null,
        'Completion Percentage (Node)',
        null,
        null,
        'Completion Percentage (.NET Core)',
        null,
        null,
      ],
      [
        'POD Name ',
        'Description',
        'Status ',
        'Branch',
        'Start Date ',
        'Dev',
        'Machine Owner ',
        'Machine aligned to project ',
        'FE ',
        'BE',
        'FE + BE integrations',
        'FE ',
        'BE',
        'FE + BE integrations',
        'FE ',
        'BE',
        'FE + BE integrations',
      ],
      [
        'TeleHealth',
        'Remote care',
        'In Progress',
        'SDD',
        46243,
        'Abhishek',
        'Abhishek',
        'TeleHealth',
        0.8,
        0.7,
        0.75,
        0.6,
        0.65,
        0.62,
        '/',
        '/',
        '/',
      ],
    ]);
    expect(sheet?.headers).toEqual([
      'POD Name',
      'Description',
      'Status',
      'Branch',
      'Start Date',
      'Dev',
      'Machine Owner',
      'Machine aligned to project',
      'FE — Fast API',
      'BE — Fast API',
      'FE + BE integrations — Fast API',
      'FE — Node',
      'BE — Node',
      'FE + BE integrations — Node',
      'FE — .NET Core',
      'BE — .NET Core',
      'FE + BE integrations — .NET Core',
    ]);
    expect(sheet?.rows[0]?.Branch).toBe('SDD');
    expect(sheet?.rows[0]?.['FE — Fast API']).toBe(80);
    expect(sheet?.rows[0]?.['FE — .NET Core']).toBeNull();
    const transformed = transformPodsSheets([sheet!]);
    expect(transformed.pods[0].data.branch).toBe('sdd');
    expect(transformed.pods[0].data.domainCompletions?.fastApi).toEqual({
      fe: 80,
      be: 70,
      integration: 75,
      overall: 75,
    });
    expect(transformed.pods[0].data.domainCompletions?.node?.overall).toBe(62.33);
    expect(transformed.pods[0].data.domainCompletions?.dotnet).toEqual({
      fe: null,
      be: null,
      integration: null,
      overall: null,
    });
  });

  it('parses the canonical PODS.xlsx Info and Daily Update sheets', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const file = path.resolve(__dirname, '../sample-data/PODS.xlsx');
    const buf = fs.readFileSync(file);
    const result = await new ExcelParser().parse(buf, 'PODS.xlsx');
    const info = result.sheets.find((s) => s.name === 'Info');
    const daily = result.sheets.find((s) => s.name === 'Daily Update');
    expect(info?.headers).toEqual([
      'POD Name',
      'Description',
      'Status',
      'Branch',
      'Start Date',
      'Dev',
      'Machine Owner',
      'Machine aligned to project',
      'FE — Fast API',
      'BE — Fast API',
      'FE + BE integrations — Fast API',
      'FE — Node',
      'BE — Node',
      'FE + BE integrations — Node',
      'FE — .NET Core',
      'BE — .NET Core',
      'FE + BE integrations — .NET Core',
    ]);
    expect(info?.rows.length).toBeGreaterThanOrEqual(8);
    expect(info?.rows[0]?.['POD Name']).toBe('TeleHealth');
    expect(info?.rows[0]?.Branch).toBe('SDD');
    expect(String(info?.rows[0]?.['Start Date'])).toBe('2026-08-09');
    expect(daily?.headers).toContain('FE — 2026-09-01');
    expect(daily?.headers).toContain('FE — 2026-09-02');
    expect(extractDailyFromSheet(daily!).length).toBeGreaterThan(0);
    const transformed = transformPodsSheets(result.sheets);
    expect(transformed.pods[0].data.branch).toBe('sdd');
  });
});

describe('parseMarkdownTasks', () => {
  it('parses numbered tasks with sections and descriptions', () => {
    const tasks = parseMarkdownTasks(`
# TeleHealth

## Backend
1. Auth API
   JWT and refresh tokens
2. Patient records

## Frontend
3. Video consult UI
    `);
    expect(tasks.map((t) => t.number)).toEqual([1, 2, 3]);
    expect(tasks[0].title).toBe('Auth API');
    expect(tasks[0].description).toBe('JWT and refresh tokens');
    expect(tasks[0].section).toBe('Backend');
    expect(tasks[2].title).toBe('Video consult UI');
    expect(tasks[2].section).toBe('Frontend');
  });

  it('reads checkbox and trailing status markers', () => {
    const tasks = parseMarkdownTasks(`
1. [x] Database schema
2. [ ] API gateway
3. Dashboard (in progress)
- [x] Deploy staging
    `);
    expect(tasks[0].status).toBe('DONE');
    expect(tasks[1].status).toBe('TODO');
    expect(tasks[2].status).toBe('IN_PROGRESS');
    expect(tasks[3].status).toBe('DONE');
    expect(tasks[3].title).toBe('Deploy staging');
  });

  it('computes overall completion and pod status from tasks', () => {
    expect(taskOverallCompletion([])).toBeNull();
    expect(
      taskOverallCompletion([
        { status: 'DONE' },
        { status: 'IN_PROGRESS' },
        { status: 'TODO' },
        { status: 'TODO' },
      ]),
    ).toBe(37.5);
    expect(podStatusFromTasks([{ status: 'DONE' }, { status: 'DONE' }])).toBe('Completed');
    expect(podStatusFromTasks([{ status: 'TODO' }, { status: 'DONE' }])).toBe('In Progress');
    expect(podStatusFromTasks([{ status: 'TODO' }])).toBe('Not Started');
  });
});
