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
  InputAdornment
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Inventory as InventoryIcon, 
  Add as AddIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { AppProvider, useApp } from './context/AppContext';
import { PersonList } from './components/PersonList';
import { PersonForm } from './components/PersonForm';
import { ProductForm } from './components/ProductForm';
import { PersonDetail } from './components/PersonDetail';
import { PurchaseModal } from './components/PurchaseModal';
import { ProductList } from './components/ProductList';
import type { Person } from './types/index';
import { theme } from './theme/theme';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'people' | 'products'>('people');
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [purchasePerson, setPurchasePerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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