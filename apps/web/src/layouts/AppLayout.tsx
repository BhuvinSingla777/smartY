import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupsIcon from '@mui/icons-material/Groups';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HistoryIcon from '@mui/icons-material/History';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';

const DRAWER_WIDTH = 248;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'BDG', path: '/bdg', icon: <GroupsIcon fontSize="small" /> },
  { label: 'PODS', path: '/pods', icon: <ViewModuleIcon fontSize="small" /> },
  { label: 'Upload', path: '/uploads', icon: <CloudUploadIcon fontSize="small" /> },
  { label: 'Imports', path: '/imports', icon: <HistoryIcon fontSize="small" /> },
];

function NavDrawerContent({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'primary.dark',
        color: '#DEEBFF',
      }}
    >
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: 'rgba(255,255,255,0.12)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <DiamondOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.2 }}>
            BDG & PODS
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
            Analytics
          </Typography>
        </Box>
      </Box>

      <List sx={{ px: 1.25, flexGrow: 1 }}>
        {navItems.map((item) => {
          const selected = pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={selected}
              onClick={onNavigate}
              sx={{
                mb: 0.5,
                borderRadius: 1.5,
                color: selected ? '#fff' : 'rgba(255,255,255,0.78)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.16)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: selected ? 700 : 500, fontSize: 14 }}
              />
            </ListItemButton>
          );
        })}
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

export default function AppLayout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  const paperSx = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    border: 'none',
    bgcolor: 'primary.dark',
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
              BDG & PODS Analytics
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
            <NavDrawerContent
              pathname={location.pathname}
              onNavigate={() => setOpen(false)}
            />
          </Drawer>
        ) : (
          <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': paperSx }}>
            <NavDrawerContent pathname={location.pathname} />
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          mt: { xs: 8, md: 0 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
