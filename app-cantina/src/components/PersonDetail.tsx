import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack,
  Person as PersonIcon,
  AccountBalanceWallet,
  ShoppingCart,
  CalendarToday,
  ExpandMore,
  ExpandLess,
  Inventory,
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CardGiftcard as OfferIcon,
  AccountBalance as CloseAccountIcon,
  AccountBalance
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import type { Person } from '../types/index';

interface PersonDetailProps {
  person: Person;
  onBack: () => void;
}

export const PersonDetail: React.FC<PersonDetailProps> = ({ person, onBack }) => {
  const { getProductById, deletePurchase, deletePurchaseItem, updatePurchaseItemQuantity, updatePerson } = useApp();
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{purchaseId: string; productId: string} | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'purchase' | 'item'; purchaseId: string; productId?: string} | null>(null);
  const [localPerson, setLocalPerson] = useState(person);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingDeposit, setEditingDeposit] = useState(false);
  const [editDeposit, setEditDeposit] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [closeAccountDialogOpen, setCloseAccountDialogOpen] = useState(false);

  React.useEffect(() => {
    setLocalPerson(person);
  }, [person]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const togglePurchase = (purchaseId: string) => {
    setExpandedPurchase(expandedPurchase === purchaseId ? null : purchaseId);
  };

  const handleDeleteClick = (type: 'purchase' | 'item', purchaseId: string, productId?: string) => {
    setItemToDelete({ type, purchaseId, productId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'purchase') {
      deletePurchase(localPerson.id, itemToDelete.purchaseId);
      // Atualiza a pessoa local
      const purchase = localPerson.purchases.find(p => p.id === itemToDelete.purchaseId);
      if (purchase) {
        setLocalPerson({
          ...localPerson,
          balance: localPerson.balance + purchase.total,
          purchases: localPerson.purchases.filter(p => p.id !== itemToDelete.purchaseId)
        });
      }
    } else if (itemToDelete.productId) {
      deletePurchaseItem(localPerson.id, itemToDelete.purchaseId, itemToDelete.productId);
      // Atualiza a pessoa local
      const purchase = localPerson.purchases.find(p => p.id === itemToDelete.purchaseId);
      const item = purchase?.items.find(i => i.productId === itemToDelete.productId);
      if (purchase && item) {
        const newItems = purchase.items.filter(i => i.productId !== itemToDelete.productId);
        if (newItems.length === 0) {
          setLocalPerson({
            ...localPerson,
            balance: localPerson.balance + item.total,
            purchases: localPerson.purchases.filter(p => p.id !== itemToDelete.purchaseId)
          });
        } else {
          const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
          setLocalPerson({
            ...localPerson,
            balance: localPerson.balance + item.total,
            purchases: localPerson.purchases.map(p => 
              p.id === itemToDelete.purchaseId 
                ? { ...p, items: newItems, total: newTotal }
                : p
            )
          });
        }
      }
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleQuantityEdit = (purchaseId: string, productId: string, currentQuantity: number) => {
    setEditingItem({ purchaseId, productId });
    setEditQuantity(currentQuantity.toString());
  };

  const handleQuantitySave = () => {
    if (!editingItem) return;
    
    const newQuantity = parseInt(editQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Quantidade inválida');
      return;
    }
    
    if (newQuantity === 0) {
      handleDeleteClick('item', editingItem.purchaseId, editingItem.productId);
      setEditingItem(null);
      return;
    }
    
    updatePurchaseItemQuantity(localPerson.id, editingItem.purchaseId, editingItem.productId, newQuantity);
    
    // Atualiza a pessoa local
    const purchase = localPerson.purchases.find(p => p.id === editingItem.purchaseId);
    const item = purchase?.items.find(i => i.productId === editingItem.productId);
    if (purchase && item) {
      const oldTotal = item.total;
      const newTotal = Math.round(item.price * newQuantity * 100) / 100;
      const diff = newTotal - oldTotal;
      
      setLocalPerson({
        ...localPerson,
        balance: localPerson.balance - diff,
        purchases: localPerson.purchases.map(p => 
          p.id === editingItem.purchaseId 
            ? {
                ...p,
                total: p.total + diff,
                items: p.items.map(i => 
                  i.productId === editingItem.productId
                    ? { ...i, quantity: newQuantity, total: newTotal }
                    : i
                )
              }
            : p
        )
      });
    }
    
    setEditingItem(null);
  };

  const handleQuantityCancel = () => {
    setEditingItem(null);
    setEditQuantity('');
  };

  const handleNameEdit = () => {
    setEditingName(true);
    setEditName(localPerson.name);
  };

  const handleNameSave = () => {
    if (!editName.trim()) {
      alert('Nome não pode estar vazio');
      return;
    }
    updatePerson(localPerson.id, { name: editName.trim() });
    setLocalPerson({ ...localPerson, name: editName.trim() });
    setEditingName(false);
  };

  const handleNameCancel = () => {
    setEditingName(false);
    setEditName('');
  };

  const handleDepositEdit = () => {
    setEditingDeposit(true);
    setEditDeposit(localPerson.initialDeposit.toString());
  };

  const handleDepositSave = () => {
    const newDeposit = parseFloat(editDeposit);
    if (isNaN(newDeposit) || newDeposit < 0) {
      alert('Depósito deve ser um valor válido');
      return;
    }
    
    // Calcula a diferença para ajustar o saldo
    const difference = newDeposit - localPerson.initialDeposit;
    const newBalance = localPerson.balance + difference;
    
    updatePerson(localPerson.id, { 
      initialDeposit: newDeposit,
      balance: newBalance
    });
    
    setLocalPerson({ 
      ...localPerson, 
      initialDeposit: newDeposit,
      balance: newBalance
    });
    setEditingDeposit(false);
  };

  const handleDepositCancel = () => {
    setEditingDeposit(false);
    setEditDeposit('');
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verifica o tamanho do arquivo (limite de 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB em bytes
      if (file.size > maxSize) {
        alert('A imagem deve ter no máximo 2MB. Por favor, escolha uma imagem menor.');
        return;
      }

      // Verifica o tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Redimensiona a imagem se for muito grande
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Cria um canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Converte para base64 com qualidade reduzida para JPEG
            const base64String = canvas.toDataURL('image/jpeg', 0.8);
            
            // Verifica se o resultado final não é muito grande para o localStorage (limite ~5MB total)
            if (base64String.length > 500000) { // ~500KB para a imagem
              alert('A imagem é muito grande mesmo após compressão. Por favor, use uma imagem menor.');
              return;
            }
            
            updatePerson(localPerson.id, { photo: base64String });
            setLocalPerson({ ...localPerson, photo: base64String });
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOfferClick = () => {
    setOfferDialogOpen(true);
    setOfferAmount(localPerson.balance.toString()); // Preenche com o saldo atual
  };

  const handleOfferConfirm = () => {
    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor, insira um valor válido para a oferta.');
      return;
    }

    if (amount > localPerson.balance) {
      alert('O valor da oferta não pode ser maior que o saldo disponível.');
      return;
    }

    // Cria uma compra normal da "Oferta Missionária"
    const offerItem = {
      productId: 'missionary-offer-' + Date.now(),
      productName: 'Oferta Missionária',
      quantity: 1,
      price: amount,
      total: amount
    };

    // Adiciona como uma compra normal
    const offerPurchase = {
      id: Date.now().toString(),
      personId: localPerson.id,
      date: new Date(),
      items: [offerItem],
      total: amount
    };

    // Diminui o saldo da pessoa (como uma compra normal)
    const newBalance = Math.round((localPerson.balance - amount) * 100) / 100;
    
    updatePerson(localPerson.id, { 
      balance: newBalance,
      purchases: [...localPerson.purchases, offerPurchase]
    });

    setLocalPerson({
      ...localPerson,
      balance: newBalance,
      purchases: [...localPerson.purchases, offerPurchase]
    });

    setOfferDialogOpen(false);
    setOfferAmount('');
  };

  const handleOfferCancel = () => {
    setOfferDialogOpen(false);
    setOfferAmount('');
  };

  const handleCloseAccountClick = () => {
    if (localPerson.balance <= 0) {
      alert('A conta já está zerada ou com saldo negativo.');
      return;
    }
    setCloseAccountDialogOpen(true);
  };

  const handleCloseAccountConfirm = () => {
    // Cria um "saque" representando o fechamento da conta
    const withdrawalItem = {
      productId: 'withdrawal-' + Date.now(),
      productName: 'Saque - Fechamento de Conta',
      quantity: 1,
      price: localPerson.balance, // Valor do saque
      total: localPerson.balance
    };

    const withdrawalPurchase = {
      id: Date.now().toString(),
      personId: localPerson.id,
      date: new Date(),
      items: [withdrawalItem],
      total: localPerson.balance // Total do saque
    };

    // Zera o saldo da pessoa
    updatePerson(localPerson.id, { 
      balance: 0,
      purchases: [...localPerson.purchases, withdrawalPurchase]
    });

    setLocalPerson({
      ...localPerson,
      balance: 0,
      purchases: [...localPerson.purchases, withdrawalPurchase]
    });

    setCloseAccountDialogOpen(false);
  };

  const handleCloseAccountCancel = () => {
    setCloseAccountDialogOpen(false);
  };

  const handleQuantityChange = (purchaseId: string, productId: string, item: any, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      handleDeleteClick('item', purchaseId, productId);
    } else {
      updatePurchaseItemQuantity(localPerson.id, purchaseId, productId, newQuantity);
      // Atualiza localmente
      const newTotal = Math.round(item.price * newQuantity * 100) / 100;
      const diff = (delta > 0 ? newTotal - item.total : item.total - newTotal);
      setLocalPerson({
        ...localPerson,
        balance: localPerson.balance + (delta > 0 ? -diff : diff),
        purchases: localPerson.purchases.map(p => 
          p.id === purchaseId 
            ? {
                ...p,
                total: p.total + (delta > 0 ? diff : -diff),
                items: p.items.map(i => 
                  i.productId === productId
                    ? { ...i, quantity: newQuantity, total: newTotal }
                    : i
                )
              }
            : p
        )
      });
    }
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ mb: 3, borderRadius: 4 }}
      >
        Voltar
      </Button>

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={localPerson.photo}
              sx={{ 
                width: 80, 
                height: 80,
                bgcolor: localPerson.photo ? 'transparent' : 'primary.light'
              }}
            >
              {!localPerson.photo && <PersonIcon sx={{ fontSize: 40 }} />}
            </Avatar>
            <IconButton
              sx={{
                position: 'absolute',
                bottom: -8,
                right: -8,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                width: 32,
                height: 32
              }}
              component="label"
            >
              <PhotoCameraIcon fontSize="small" />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            {editingName ? (
              <TextField
                variant="standard"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleNameSave}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNameSave();
                  if (e.key === 'Escape') handleNameCancel();
                }}
                autoFocus
                sx={{ 
                  '& .MuiInput-root': { 
                    fontSize: '2.125rem',
                    fontWeight: 500
                  }
                }}
              />
            ) : (
              <Typography 
                variant="h4" 
                fontWeight={500}
                onClick={handleNameEdit}
                sx={{ 
                  cursor: 'pointer', 
                  display: 'inline-block',
                  '&:hover': { 
                    bgcolor: 'action.hover',
                    px: 1,
                    borderRadius: 1
                  },
                  transition: 'all 0.2s'
                }}
              >
                {localPerson.name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {localPerson.customId && `ID: ${localPerson.customId} • `}
              {localPerson.purchases.length} compras realizadas
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccountBalanceWallet />
                  <Typography variant="body2">Depósito Inicial</Typography>
                </Box>
                {editingDeposit ? (
                  <TextField
                    type="number"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(e.target.value)}
                    onBlur={handleDepositSave}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleDepositSave();
                      if (e.key === 'Escape') handleDepositCancel();
                    }}
                    autoFocus
                    variant="standard"
                    sx={{ 
                      '& .MuiInput-root': { 
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'white',
                        '&:before': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&:hover:before': { borderColor: 'rgba(255,255,255,0.5)' },
                        '&:after': { borderColor: 'white' }
                      },
                      '& input': { color: 'white' }
                    }}
                    InputProps={{
                      startAdornment: <Typography sx={{ color: 'rgba(255,255,255,0.9)', mr: 0.5, fontSize: '1.25rem', fontWeight: 600 }}>R$</Typography>
                    }}
                  />
                ) : (
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    onClick={handleDepositEdit}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'inline-block',
                      '&:hover': { 
                        opacity: 0.8,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        px: 1,
                        borderRadius: 1
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {formatCurrency(localPerson.initialDeposit)}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              borderRadius: 2, 
              bgcolor: localPerson.balance > 0 ? 'success.main' : 'error.main',
              color: 'white'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccountBalanceWallet />
                  <Typography variant="body2">Saldo Atual</Typography>
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(localPerson.balance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, bgcolor: 'secondary.main', color: 'secondary.contrastText' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShoppingCart />
                  <Typography variant="body2">Total Gasto</Typography>
                </Box>
                <Typography variant="h6" fontWeight={600}>
                  {formatCurrency(localPerson.purchases.reduce((sum, p) => sum + p.total, 0))}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Button
            variant="contained"
            startIcon={<OfferIcon />}
            onClick={handleOfferClick}
            disabled={localPerson.balance <= 0}
            sx={{ 
              bgcolor: 'tertiary.main', 
              '&:hover': { bgcolor: 'tertiary.dark' },
              borderRadius: 2,
              px: 3
            }}
          >
            Oferta<br /> Missionária
          </Button>
          <Button
            variant="contained"
            startIcon={<CloseAccountIcon />}
            onClick={handleCloseAccountClick}
            disabled={localPerson.balance <= 0}
            sx={{ 
              bgcolor: 'error.main', 
              '&:hover': { bgcolor: 'error.dark' },
              borderRadius: 2,
              px: 3
            }}
          >
            Fechar<br /> Conta
          </Button>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={500} sx={{ mb: 2 }}>
          Histórico de Compras
        </Typography>
        
        {localPerson.purchases.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            py: 6
          }}>
            <Typography color="text.secondary">
              Nenhuma compra realizada ainda
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {localPerson.purchases.map((purchase) => {
              // Verifica se é uma transação especial (saque ou oferta)
              const isSpecialTransaction = purchase.items.length === 1 && 
                (purchase.items[0].productName === 'Saque - Fechamento de Conta' || 
                 purchase.items[0].productName === 'Oferta Missionária');

              if (isSpecialTransaction) {
                const item = purchase.items[0];
                const isWithdrawal = item.productName === 'Saque - Fechamento de Conta';
                
                return (
                  <Card key={purchase.id} sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isWithdrawal ? (
                            <AccountBalance color="error" />
                          ) : (
                            <OfferIcon sx={{ color: 'secondary.main' }} />
                          )}
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {item.productName}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarToday fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(purchase.date)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip 
                            label={formatCurrency(purchase.total)}
                            color={isWithdrawal ? "error" : "secondary"}
                            sx={{ fontWeight: 600 }}
                          />
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick('purchase', purchase.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              }

              // Compras normais de produtos (com expansão)
              return (
                <Card key={purchase.id} sx={{ borderRadius: 2 }}>
                  <CardContent 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => togglePurchase(purchase.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(purchase.date)}
                          </Typography>
                        </Box>
                        <Typography variant="body1" fontWeight={500}>
                          {purchase.items.length} {purchase.items.length === 1 ? 'item' : 'itens'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={formatCurrency(purchase.total)}
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick('purchase', purchase.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small">
                          {expandedPurchase === purchase.id ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <Collapse in={expandedPurchase === purchase.id}>
                    <Divider />
                    <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default' }}>
                      <List dense>
                        {purchase.items.map((item, index) => (
                          <ListItem key={index} disableGutters sx={{ display: 'flex', alignItems: 'center' }}>
                            <Inventory fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                            <ListItemText
                              primary={item.productName}
                              secondary={formatCurrency(item.total)}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {editingItem?.purchaseId === purchase.id && editingItem?.productId === item.productId ? (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(e.target.value)}
                                  onBlur={handleQuantitySave}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleQuantitySave();
                                    if (e.key === 'Escape') handleQuantityCancel();
                                  }}
                                  autoFocus
                                  sx={{ width: 60 }}
                                  variant="standard"
                                />
                              ) : (
                                <>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleQuantityChange(purchase.id, item.productId, item, -1)}
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      minWidth: 30, 
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      '&:hover': { bgcolor: 'action.hover' },
                                      px: 1,
                                      borderRadius: 1
                                    }}
                                    onClick={() => handleQuantityEdit(purchase.id, item.productId, item.quantity)}
                                  >
                                    {item.quantity}
                                  </Typography>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleQuantityChange(purchase.id, item.productId, item, 1)}
                                  >
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteClick('item', purchase.id, item.productId)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Stack>
        )}
      </Paper>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            {itemToDelete?.type === 'purchase' 
              ? 'Tem certeza que deseja excluir esta compra? O saldo será restaurado.'
              : 'Tem certeza que deseja excluir este item? O saldo será restaurado.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Oferta */}
      <Dialog
        open={offerDialogOpen}
        onClose={handleOfferCancel}
        aria-labelledby="offer-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="offer-dialog-title">
          Oferta Missionária
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Registrar oferta missionária de <strong>{localPerson.name}</strong>:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Saldo disponível: <strong>{formatCurrency(localPerson.balance)}</strong>
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Valor da Oferta Missionária"
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
              }}
              sx={{ borderRadius: 2 }}
              helperText="O valor será descontado do saldo da pessoa"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOfferCancel} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleOfferConfirm} 
            variant="contained"
            sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
          >
            Registrar Oferta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Fechar Conta */}
      <Dialog
        open={closeAccountDialogOpen}
        onClose={handleCloseAccountCancel}
        aria-labelledby="close-account-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="close-account-dialog-title">
          Fechar Conta
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Tem certeza que deseja fechar a conta de <strong>{localPerson.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Esta ação irá:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Gerar um saque de <strong>{formatCurrency(localPerson.balance)}</strong>
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Zerar o saldo da conta
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Registrar a operação no histórico
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAccountCancel} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handleCloseAccountConfirm} 
            variant="contained"
            color="error"
          >
            Confirmar Fechamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};