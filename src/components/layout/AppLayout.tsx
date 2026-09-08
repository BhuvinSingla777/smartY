'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import AppsIcon from '@mui/icons-material/Apps';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { SIDEBAR_BG, SIDEBAR_BG_END } from '@/lib/theme';

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: 'PODS', path: '/pods', icon: <ViewKanbanIcon fontSize="small" /> },
  { label: 'BDG', path: '/bdg', icon: <AssignmentOutlinedIcon fontSize="small" /> },
  { label: 'Import', path: '/uploads', icon: <CloudUploadIcon fontSize="small" /> },
  { label: 'History', path: '/imports', icon: <HistoryOutlinedIcon fontSize="small" /> },
];

function NavDrawerContent({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  const router = useRouter();
  const [createAnchor, setCreateAnchor] = useState<null | HTMLElement>(null);
  const [appsAnchor, setAppsAnchor] = useState<null | HTMLElement>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: SIDEBAR_BG,
        color: '#0A454C',
        backgroundImage: `linear-gradient(180deg, ${SIDEBAR_BG} 0%, ${SIDEBAR_BG_END} 100%)`,
        borderRight: '1px solid',
        borderColor: '#B7E6EC',
      }}
    >
      <Box sx={{ px: 1.5, pt: 1.75, pb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.25,
            bgcolor: 'rgba(31, 138, 150, 0.12)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <DiamondOutlinedIcon sx={{ color: '#1F8A96', fontSize: 20 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Create">
          <IconButton
            size="small"
            onClick={(e) => setCreateAnchor(e.currentTarget)}
            sx={{ color: '#0F5E68' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Apps">
          <IconButton
            size="small"
            onClick={(e) => setAppsAnchor(e.currentTarget)}
            sx={{ color: '#0F5E68' }}
          >
            <AppsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={createAnchor}
          open={Boolean(createAnchor)}
          onClose={() => setCreateAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              setCreateAnchor(null);
              onNavigate?.();
              router.push('/pods');
            }}
          >
            Add POD
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateAnchor(null);
              onNavigate?.();
              router.push('/uploads');
            }}
          >
            Import workbook
          </MenuItem>
        </Menu>
        <Menu anchorEl={appsAnchor} open={Boolean(appsAnchor)} onClose={() => setAppsAnchor(null)}>
          {navItems.map((item) => (
            <MenuItem
              key={item.path}
              onClick={() => {
                setAppsAnchor(null);
                onNavigate?.();
                router.push(item.path);
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Box sx={{ px: 1.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: '#FF8B00',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <RocketLaunchIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#0A454C', lineHeight: 1.2 }} noWrap>
            BDG & PODS
          </Typography>
          <Typography variant="caption" sx={{ color: '#4A6B70' }}>
            Software project
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.25, flexGrow: 1, pt: 0.5 }}>
        {navItems.map((item) => {
          const selected =
            item.path === '/pods'
              ? pathname === '/pods' || pathname.startsWith('/pods/')
              : pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              component={NextLink}
              href={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                mb: 0.25,
                py: 0.75,
                borderRadius: 1.5,
                color: selected ? '#0A454C' : '#0F5E68',
                '&.Mui-selected': {
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 0 0 1px #B7E6EC',
                  '&:hover': { bgcolor: '#FFFFFF' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.55)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 600 : 500, fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
        <ListItemButton
          disabled
          sx={{ py: 0.75, borderRadius: 1.5, color: 'rgba(255,255,255,0.55)' }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Add item" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.12)' }} />
        <ListItemButton
          disabled
          sx={{ py: 0.75, borderRadius: 1.5, color: 'rgba(255,255,255,0.55)' }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </List>

      <Box sx={{ p: 1.5, pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            bgcolor: '#fff',
            borderRadius: 2,
            px: 1.5,
            py: 1.25,
            boxShadow: '0 4px 12px rgba(9, 30, 66, 0.18)',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'primary.main',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            BP
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              Internal Team
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              analytics@bdg-pods
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const paperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    border: 'none',
    bgcolor: SIDEBAR_BG,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile ? (
        <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => setOpen(true)} sx={{ mr: 1, color: 'primary.main' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              BDG & PODS
            </Typography>
          </Toolbar>
        </AppBar>
      ) : null}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': paperSx }}
          >
            <NavDrawerContent pathname={pathname} onNavigate={() => setOpen(false)} />
          </Drawer>
        ) : (
          <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': paperSx }}>
            <NavDrawerContent pathname={pathname} />
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          pt: { xs: 10, md: 3 },
          mt: 0,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
