import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  Box
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCodeScanner,
  Edit
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { BarcodeScanner } from './BarcodeScanner';
import { BarcodeInput } from './BarcodeInput';

interface ProductFormProps {
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onClose }) => {
  const { addProduct } = useApp();
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && price && stock) {
      addProduct({
        name,
        barcode: barcode || undefined,
        price: parseFloat(price),
        stock: parseInt(stock)
      });
      onClose();
    }
  };

  const handleScan = (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setShowScanner(false);
    setShowBarcodeInput(false);
  };

  return (
    <>
      <Dialog 
        open 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          Cadastrar Produto
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="Nome do Produto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />

              <Box>
                <TextField
                  label="Código de Barras"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  fullWidth
                  variant="outlined"
                  helperText="Digite o código ou use um dos botões abaixo"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowScanner(true)}
                    startIcon={<QrCodeScanner />}
                    size="small"
                    sx={{ borderRadius: 4 }}
                  >
                    Scanner Câmera
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowBarcodeInput(true)}
                    startIcon={<Edit />}
                    size="small"
                    sx={{ borderRadius: 4 }}
                  >
                    Digitar Código
                  </Button>
                </Stack>
              </Box>

              <TextField
                label="Preço"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                fullWidth
                required
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{
                  step: '0.01',
                  min: '0'
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />

              <TextField
                label="Estoque"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                fullWidth
                required
                variant="outlined"
                InputProps={{
                  endAdornment: <InputAdornment position="end">unidades</InputAdornment>,
                }}
                inputProps={{
                  min: '0'
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{ borderRadius: 4 }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              variant="contained"
              sx={{ borderRadius: 4 }}
            >
              Cadastrar
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <BarcodeInput
        open={showBarcodeInput}
        onScan={handleScan}
        onClose={() => setShowBarcodeInput(false)}
      />
    </>
  );
};