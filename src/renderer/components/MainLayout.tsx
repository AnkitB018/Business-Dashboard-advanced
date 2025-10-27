import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  AccessTime,
  ShoppingCart,
  Inventory,
  Assessment,
  Settings,
  AccountCircle,
  ExitToApp,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { NavigationItem } from '../types/Common';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate: (page: string) => void;
}

const DRAWER_WIDTH = 280;
const COLLAPSED_DRAWER_WIDTH = 64;

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  currentPage = 'dashboard',
  onNavigate 
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: 'Dashboard',
      path: '/dashboard'
    },
    {
      id: 'employees',
      title: 'Employee Management',
      icon: 'People',
      path: '/employees'
    },
    {
      id: 'attendance',
      title: 'Attendance Tracking',
      icon: 'AccessTime',
      path: '/attendance'
    },
    {
      id: 'sales',
      title: 'Sales Management',
      icon: 'ShoppingCart',
      path: '/sales'
    },
    {
      id: 'purchases',
      title: 'Purchase Management',
      icon: 'Inventory',
      path: '/purchases'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: 'Assessment',
      path: '/reports'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'Settings',
      path: '/settings'
    }
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      Dashboard: <Dashboard />,
      People: <People />,
      AccessTime: <AccessTime />,
      ShoppingCart: <ShoppingCart />,
      Inventory: <Inventory />,
      Assessment: <Assessment />,
      Settings: <Settings />
    };
    return icons[iconName] || <Dashboard />;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setDrawerCollapsed(!drawerCollapsed);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };



  const handleNavigate = (itemId: string) => {
    onNavigate(itemId);
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      {/* Logo and Title */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerCollapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(220, 38, 38, 0.12)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
        }}
      >
        {!drawerCollapsed && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ 
                mr: 2, 
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white'
              }}>
                📊
              </Avatar>
              <Box>
                <Typography variant="h6" noWrap component="div" fontWeight="bold" sx={{
                  background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}>
                  Business Dashboard
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comprehensive Business Management
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleDrawerCollapse} size="small">
              <ChevronLeft />
            </IconButton>
          </>
        )}
        {drawerCollapsed && (
          <IconButton onClick={handleDrawerCollapse} size="small">
            <ChevronRight />
          </IconButton>
        )}
      </Box>

      {/* Navigation Items */}
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ px: drawerCollapsed ? 1 : 2, mb: 0.5 }}>
            <Tooltip title={drawerCollapsed ? item.title : ''} placement="right">
              <ListItemButton
                selected={currentPage === item.id}
                onClick={() => handleNavigate(item.id)}
                sx={{
                  borderRadius: '8px',
                  minHeight: 48,
                  justifyContent: drawerCollapsed ? 'center' : 'initial',
                  px: drawerCollapsed ? 0 : 2.5,
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(220, 38, 38, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: drawerCollapsed ? 0 : 3,
                    justifyContent: 'center',
                    color: currentPage === item.id ? 'inherit' : 'action.active',
                  }}
                >
                  {getIcon(item.icon)}
                </ListItemIcon>
                {!drawerCollapsed && (
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: currentPage === item.id ? 600 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>      <Divider sx={{ my: 2 }} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px` },
          backgroundColor: 'rgba(255,255,255,0.82)',
          color: '#111827',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.1)',
          borderTop: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.id === currentPage)?.title || 'Dashboard'}
          </Typography>

          {/* User Menu */}
          <Tooltip title="Account settings">
            <IconButton
              size="large"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(220, 38, 38, 0.12)',
              boxShadow: '0 12px 32px rgba(220, 38, 38, 0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
              backgroundColor: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRight: '1px solid rgba(220, 38, 38, 0.12)',
              boxShadow: '0 8px 24px rgba(220, 38, 38, 0.06)',
              transition: 'width 0.3s ease-in-out',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          background: 'transparent',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <Toolbar /> {/* Spacer for app bar */}
        <Box sx={{ 
          p: 3, 
          height: 'calc(100vh - 64px)', 
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </Box>
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleUserMenuClose}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications removed per user preference */}
    </Box>
  );
};

export default MainLayout;