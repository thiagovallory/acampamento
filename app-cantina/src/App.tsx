import { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  ToggleButtonGroup,
  ToggleButton,
  Fab,
  Alert,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Inventory as InventoryIcon, 
  Add as AddIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  MoreVert as MoreVertIcon,
  Assessment as AssessmentIcon,
  Upload as UploadIcon,
  FileUpload as FileUploadIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { AppProvider, useApp } from './context/AppContext';
import { PersonList } from './components/PersonList';
import { PersonForm } from './components/PersonForm';
import { ProductForm } from './components/ProductForm';
import { PersonDetail } from './components/PersonDetail';
import { PurchaseModal } from './components/PurchaseModal';
import { ProductList } from './components/ProductList';
import { CSVImport } from './components/CSVImport';
import { Reports } from './components/Reports';
import { EncerrarAcampamento } from './components/EncerrarAcampamento';
import type { Person } from './types/index';
import { theme } from './theme/theme';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'people' | 'products'>('people');
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [purchasePerson, setPurchasePerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvImportType, setCSVImportType] = useState<'products' | 'people'>('products');
  const [showReports, setShowReports] = useState(false);
  const [showEncerrarAcampamento, setShowEncerrarAcampamento] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { people } = useApp();

  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'people' | 'products' | null,
  ) => {
    if (newValue !== null) {
      setActiveTab(newValue);
      setSearchTerm(''); // Limpa a busca ao mudar de aba
      setSelectedPerson(null); // Limpa a pessoa selecionada ao mudar de aba
    }
  };

  // Filtra pessoas baseado no termo de busca (nome ou ID customizado)
  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.customId && person.customId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handler para Enter no campo de busca
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredPeople.length === 1) {
      // Se há exatamente uma pessoa encontrada, abre a tela de compra
      setPurchasePerson(filteredPeople[0]);
    }
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleImportCSV = (type: 'products' | 'people') => {
    setCSVImportType(type);
    setShowCSVImport(true);
    handleMenuClose();
  };

  const handleReports = () => {
    setShowReports(true);
    handleMenuClose();
  };

  const handleEncerrarAcampamento = () => {
    setShowEncerrarAcampamento(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'surface.variant', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 500 }}>
            Sistema de Cantina
          </Typography>
          
          <ToggleButtonGroup
            value={activeTab}
            exclusive
            onChange={handleTabChange}
            aria-label="navigation tabs"
            sx={{
              mr: 2,
              '& .MuiToggleButton-root': {
                borderRadius: 4,
                border: 'none',
                mx: 0.5,
                px: 2,
                py: 1,
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="people" aria-label="pessoas">
              <PeopleIcon sx={{ mr: 1, fontSize: 20 }} />
              Pessoas
            </ToggleButton>
            <ToggleButton value="products" aria-label="produtos">
              <InventoryIcon sx={{ mr: 1, fontSize: 20 }} />
              Produtos
            </ToggleButton>
          </ToggleButtonGroup>

          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            aria-label="mais opções"
          >
            <MoreVertIcon />
          </IconButton>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleImportCSV('products')}>
              <ListItemIcon>
                <FileUploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Importar Produtos CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleImportCSV('people')}>
              <ListItemIcon>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Importar Pessoas CSV</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleReports}>
              <ListItemIcon>
                <AssessmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Relatórios</ListItemText>
            </MenuItem>
            <MenuItem 
              onClick={handleEncerrarAcampamento}
              sx={{ 
                color: 'warning.main',
                '&:hover': { 
                  bgcolor: 'warning.50' 
                }
              }}
            >
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" sx={{ color: 'warning.main' }} />
              </ListItemIcon>
              <ListItemText>Encerrar Acampamento</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
        {selectedPerson ? (
          <PersonDetail person={selectedPerson} onBack={() => setSelectedPerson(null)} />
        ) : activeTab === 'people' ? (
          <Stack spacing={3}>
            <TextField
              fullWidth
              placeholder="Buscar pessoa por nome ou ID... (Enter para abrir compra)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 500,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                }
              }}
            />

            <PersonList 
              people={filteredPeople}
              onSelectPerson={(person) => {
                const event = window.event as MouseEvent;
                if (event && (event.ctrlKey || event.metaKey)) {
                  setPurchasePerson(person);
                } else {
                  setSelectedPerson(person);
                }
              }}
            />
            
            {searchTerm && filteredPeople.length === 0 && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 200,
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 3
              }}>
                <Typography variant="body1" color="text.secondary">
                  Nenhuma pessoa encontrada com o nome "{searchTerm}"
                </Typography>
              </Box>
            )}

            {!searchTerm && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <strong>Dica:</strong> Clique em uma pessoa para ver detalhes ou Ctrl+Clique (Cmd+Clique no Mac) para fazer uma nova compra
              </Alert>
            )}
          </Stack>
        ) : (
          <ProductList />
        )}
      </Container>

      <Fab
        color="primary"
        aria-label={selectedPerson ? "nova compra" : "add"}
        onClick={() => {
          if (selectedPerson) {
            setPurchasePerson(selectedPerson);
          } else {
            activeTab === 'people' ? setShowPersonForm(true) : setShowProductForm(true);
          }
        }}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          borderRadius: 4,
        }}
      >
        {selectedPerson ? <ShoppingCartIcon /> : <AddIcon />}
      </Fab>

      {showPersonForm && <PersonForm onClose={() => setShowPersonForm(false)} />}
      {showProductForm && <ProductForm onClose={() => setShowProductForm(false)} />}
      {purchasePerson && (
        <PurchaseModal
          person={purchasePerson}
          onClose={() => setPurchasePerson(null)}
        />
      )}
      {showCSVImport && (
        <CSVImport
          open={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          type={csvImportType}
        />
      )}
      {showReports && (
        <Reports
          open={showReports}
          onClose={() => setShowReports(false)}
        />
      )}
      {showEncerrarAcampamento && (
        <EncerrarAcampamento
          open={showEncerrarAcampamento}
          onClose={() => setShowEncerrarAcampamento(false)}
        />
      )}
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;