import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Search,
  QrCodeScanner,
  Add,
  Remove,
  ShoppingCart,
  Delete
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import type { Person, PurchaseItem } from '../types/index';
import { BarcodeScanner } from './BarcodeScanner';

interface PurchaseModalProps {
  person: Person;
  onClose: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ person, onClose }) => {
  const { products, addPurchase, getProductByBarcode } = useApp();
  const [cartItems, setCartItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredProducts = products.filter(p => {
    // Primeiro filtra produtos com estoque
    if (p.stock <= 0) return false;
    
    // Extrai apenas o código de barras da busca, ignorando quantidade (ex: "2*123" -> "123")
    const quantityMatch = searchTerm.trim().match(/^(\d+)\*(.+)$/);
    const searchCode = quantityMatch ? quantityMatch[2] : searchTerm;
    
    return p.name.toLowerCase().includes(searchCode.toLowerCase()) ||
           p.barcode?.includes(searchCode);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.productId === productId);
    
    if (existingItem) {
      updateQuantity(productId, existingItem.quantity + 1);
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: Math.round(product.price * 100) / 100
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.productId !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      if (!product || quantity > product.stock) return;
      
      setCartItems(cartItems.map(item => 
        item.productId === productId
          ? { ...item, quantity, total: Math.round(item.price * quantity * 100) / 100 }
          : item
      ));
    }
  };

  const getTotalAmount = () => {
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    // Arredonda para 2 casas decimais para evitar problemas de precisão
    return Math.round(total * 100) / 100;
  };

  const handlePurchase = () => {
    if (cartItems.length === 0) return;
    
    const total = getTotalAmount();
    const balance = Math.round(person.balance * 100) / 100;
    
    // Adiciona uma pequena tolerância para evitar erros de arredondamento (0.001 = 0.1 centavo)
    if (total > balance + 0.001) {
      alert(`Saldo insuficiente! Total: ${formatCurrency(total)}, Saldo: ${formatCurrency(balance)}`);
      return;
    }

    addPurchase(person.id, cartItems);
    onClose();
  };

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      addToCart(product.id);
      setShowScanner(false);
    } else {
      alert('Produto não encontrado com o código: ' + barcode);
    }
  };

  // Handler para Enter no campo de busca
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const input = searchTerm.trim();
      
      // Verifica se tem o padrão de quantidade (ex: 2*codigo, 10*codigo)
      const quantityMatch = input.match(/^(\d+)\*(.+)$/);
      
      if (quantityMatch) {
        // Extrai quantidade e código
        const quantity = parseInt(quantityMatch[1]);
        const barcode = quantityMatch[2];
        
        const product = getProductByBarcode(barcode);
        if (product) {
          // Verifica se tem estoque suficiente
          if (quantity > product.stock) {
            alert(`Estoque insuficiente! Disponível: ${product.stock} unidades`);
            return;
          }
          
          // Adiciona a quantidade especificada
          const existingItem = cartItems.find(item => item.productId === product.id);
          
          if (existingItem) {
            // Item já existe no carrinho, soma as quantidades
            const newQuantity = existingItem.quantity + quantity;
            
            if (newQuantity > product.stock) {
              alert(`Estoque insuficiente! Disponível: ${product.stock}, já no carrinho: ${existingItem.quantity}`);
              return;
            }
            
            updateQuantity(product.id, newQuantity);
          } else {
            // Item não existe no carrinho, cria novo
            const newItem = {
              productId: product.id,
              productName: product.name,
              quantity: quantity,
              price: product.price,
              total: Math.round(product.price * quantity * 100) / 100
            };
            setCartItems([...cartItems, newItem]);
          }
          setSearchTerm(''); // Limpa o campo após adicionar
        } else {
          alert(`Produto não encontrado com o código: ${barcode}`);
        }
      } else {
        // Verifica se é um código de barras simples (quantidade 1)
        const product = getProductByBarcode(input);
        if (product) {
          addToCart(product.id);
          setSearchTerm(''); // Limpa o campo após adicionar
        }
      }
    }
  };

  return (
    <>
      <Dialog 
        open 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box>
            <Typography variant="h5">
              Nova Compra de{' '}
              <Typography 
                component="span" 
                variant="h5" 
                sx={{ fontWeight: 600, color: 'primary.main' }}
              >
                {person.name}
              </Typography>
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                bgcolor: person.balance > 0 ? 'success.main' : 'error.main',
                color: 'white',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 600,
                display: 'inline-block'
              }}
            >
              Saldo: {formatCurrency(person.balance)}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', borderRight: 1, borderColor: 'divider' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Digite código ou 2*código para quantidade (Enter para adicionar)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
                  startIcon={<QrCodeScanner />}
                  sx={{ borderRadius: 2, minWidth: 120 }}
                >
                  Escanear
                </Button>
              </Box>

              {filteredProducts.length === 0 && (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  bgcolor: 'background.paper',
                  borderRadius: 2
                }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm 
                      ? 'Nenhum produto disponível com estoque para esta busca'
                      : 'Nenhum produto disponível com estoque no momento'}
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                {filteredProducts.map((product) => (
                  <Grid item xs={12} sm={6} key={product.id}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={500}>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(product.price)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Estoque: {product.stock} | {product.barcode && `Código: ${product.barcode}`}
                          </Typography>
                        </Box>
                        <IconButton
                          color="primary"
                          onClick={() => addToCart(product.id)}
                          disabled={product.stock === 0}
                          sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                        >
                          <Add />
                        </IconButton>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Box>

          <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ShoppingCart />
              Carrinho
            </Typography>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {cartItems.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                  Carrinho vazio
                </Typography>
              ) : (
                <List>
                  {cartItems.map((item) => (
                    <ListItem key={item.productId} disableGutters sx={{ py: 1 }}>
                      <ListItemText
                        primary={item.productName}
                        secondary={`${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.total)}`}
                      />
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 20, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            sx={{ bgcolor: 'action.hover' }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => updateQuantity(item.productId, 0)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(getTotalAmount())}
                </Typography>
              </Box>

              {getTotalAmount() > person.balance + 0.001 && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  Saldo insuficiente!
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePurchase}
                disabled={cartItems.length === 0 || getTotalAmount() > person.balance + 0.001}
                startIcon={<ShoppingCart />}
                sx={{ borderRadius: 2, py: 1.5 }}
              >
                Finalizar Compra
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

    </>
  );
};