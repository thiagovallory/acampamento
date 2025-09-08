import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

export const ProductList: React.FC = () => {
  const { products, updateProduct, deleteProduct } = useApp();
  const [editingField, setEditingField] = useState<{productId: string; field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getStockColor = (stock: number) => {
    if (stock > 10) return 'success';
    if (stock > 0) return 'warning';
    return 'error';
  };

  const handleFieldClick = (productId: string, field: string, currentValue: any) => {
    setEditingField({ productId, field });
    
    if (field === 'price') {
      setEditValue(currentValue.toString());
    } else if (field === 'stock') {
      setEditValue(currentValue.toString());
    } else {
      setEditValue(currentValue || '');
    }
  };

  const handleFieldSave = () => {
    if (!editingField) return;
    
    const { productId, field } = editingField;
    let value: any = editValue.trim();
    
    if (field === 'price') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        alert('Preço deve ser um número válido maior ou igual a zero.');
        return;
      }
      value = numValue;
    } else if (field === 'stock') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        alert('Estoque deve ser um número inteiro maior ou igual a zero.');
        return;
      }
      value = numValue;
    } else if (field === 'name' && !value) {
      alert('Nome do produto não pode estar vazio.');
      return;
    } else if (field === 'barcode' && value === '') {
      value = undefined;
    }
    
    updateProduct(productId, { [field]: value });
    setEditingField(null);
    setEditValue('');
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      setProductToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setProductToDelete(null);
    setDeleteDialogOpen(false);
  };

  if (products.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 300,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 3
      }}>
        <Typography variant="body1" color="text.secondary">
          Nenhum produto cadastrado ainda
        </Typography>
      </Box>
    );
  }

  return (
    <>
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'surface.variant' }}>
            <TableCell sx={{ fontWeight: 600, width: '30%' }}>Produto</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '25%' }}>Código de Barras</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '15%' }}>Preço</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '20%' }}>Estoque</TableCell>
            <TableCell sx={{ fontWeight: 600, width: '10%' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              sx={{ 
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                {editingField?.productId === product.id && editingField?.field === 'name' ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleFieldSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleFieldSave();
                      if (e.key === 'Escape') handleFieldCancel();
                    }}
                    autoFocus
                    variant="standard"
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '0.875rem',
                        padding: '2px 0'
                      }
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    fontWeight={500}
                    onClick={() => handleFieldClick(product.id, 'name', product.name)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 0.5, borderRadius: 1, display: 'inline-block' }}
                  >
                    {product.name}
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={{ width: '25%' }}>
                {editingField?.productId === product.id && editingField?.field === 'barcode' ? (
                  <TextField
                    size="small"
                    fullWidth
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleFieldSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleFieldSave();
                      if (e.key === 'Escape') handleFieldCancel();
                    }}
                    placeholder="Código de barras"
                    autoFocus
                    variant="standard"
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '0.875rem',
                        padding: '2px 0'
                      }
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    onClick={() => handleFieldClick(product.id, 'barcode', product.barcode)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 0.5, borderRadius: 1, display: 'inline-block' }}
                  >
                    {product.barcode || '-'}
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={{ width: '15%' }}>
                {editingField?.productId === product.id && editingField?.field === 'price' ? (
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleFieldSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleFieldSave();
                      if (e.key === 'Escape') handleFieldCancel();
                    }}
                    autoFocus
                    variant="standard"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>
                    }}
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '0.875rem',
                        padding: '2px 0'
                      }
                    }}
                  />
                ) : (
                  <Typography 
                    variant="body2" 
                    fontWeight={500}
                    onClick={() => handleFieldClick(product.id, 'price', product.price)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 0.5, borderRadius: 1, display: 'inline-block' }}
                  >
                    {formatCurrency(product.price)}
                  </Typography>
                )}
              </TableCell>
              <TableCell sx={{ width: '20%' }}>
                {editingField?.productId === product.id && editingField?.field === 'stock' ? (
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleFieldSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleFieldSave();
                      if (e.key === 'Escape') handleFieldCancel();
                    }}
                    autoFocus
                    variant="standard"
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '0.875rem',
                        padding: '2px 0'
                      }
                    }}
                  />
                ) : (
                  <Box 
                    onClick={() => handleFieldClick(product.id, 'stock', product.stock)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, p: 0.5, borderRadius: 1, display: 'inline-block' }}
                  >
                    <Chip 
                      label={`${product.stock} unidades`}
                      color={getStockColor(product.stock)}
                      size="small"
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(product.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    
    <Dialog
      open={deleteDialogOpen}
      onClose={handleDeleteCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        Confirmar Exclusão
      </DialogTitle>
      <DialogContent>
        <Typography id="delete-dialog-description">
          Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteCancel} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleDeleteConfirm} color="error" variant="contained">
          Excluir
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};