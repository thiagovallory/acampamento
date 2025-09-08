import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Stack,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';

interface EncerrarAcampamentoProps {
  open: boolean;
  onClose: () => void;
}

type BalanceAction = 'saque' | 'missionario';

export const EncerrarAcampamento: React.FC<EncerrarAcampamentoProps> = ({ open, onClose }) => {
  const { people, products, encerrarAcampamento } = useApp();
  const [step, setStep] = useState<'confirm' | 'balance-choice' | 'processing' | 'completed'>('confirm');
  const [balanceAction, setBalanceAction] = useState<BalanceAction>('saque');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    peopleWithBalance: number;
    totalBalance: number;
    productsCleared: number;
    reportsGenerated: string[];
  } | null>(null);

  // Calcular pessoas com saldo positivo e total
  const peopleWithPositiveBalance = people.filter(person => person.balance > 0);
  const totalPositiveBalance = peopleWithPositiveBalance.reduce((sum, person) => sum + person.balance, 0);

  const handleConfirmStart = () => {
    if (peopleWithPositiveBalance.length > 0) {
      setStep('balance-choice');
    } else {
      setStep('processing');
      processEncerramento('saque'); // Não importa qual escolher se não há saldos
    }
  };

  const handleBalanceChoice = () => {
    setStep('processing');
    processEncerramento(balanceAction);
  };

  const processEncerramento = async (action: BalanceAction) => {
    setIsProcessing(true);
    
    try {
      // Gerar relatórios antes de limpar os dados
      const reportsGenerated: string[] = [];
      
      // Gerar todos os relatórios em CSV
      await generateFinalReportsCSV(reportsGenerated);
      
      // Gerar todos os relatórios em PDF  
      await generateFinalReportsPDF(reportsGenerated);
      
      // Encerrar acampamento (limpar saldos e estoque)
      await encerrarAcampamento(action);
      
      setResults({
        peopleWithBalance: peopleWithPositiveBalance.length,
        totalBalance: totalPositiveBalance,
        productsCleared: products.filter(p => p.stock > 0).length,
        reportsGenerated
      });
      
      setStep('completed');
    } catch (error) {
      console.error('Erro ao encerrar acampamento:', error);
      alert('Erro ao encerrar acampamento. Tente novamente.');
    }
    
    setIsProcessing(false);
  };

  const generateFinalReportsCSV = async (reportsGenerated: string[]) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // 1. Pessoas com histórico completo
    const detailedPeopleData: any[] = [];
    people.forEach(person => {
      if (person.purchases.length === 0) {
        detailedPeopleData.push({
          'Nome': person.name,
          'ID': person.customId || '',
          'Saldo Final': `R$ ${person.balance.toFixed(2)}`,
          'Depósito': `R$ ${person.initialDeposit.toFixed(2)}`,
          'Data Compra': '',
          'Produto': 'Nenhuma compra',
          'Quantidade': '',
          'Valor': '',
          'Destino Saldo': person.balance > 0 ? (balanceAction === 'saque' ? 'Saque' : 'Missionário') : ''
        });
      } else {
        person.purchases.forEach(purchase => {
          purchase.items.forEach(item => {
            detailedPeopleData.push({
              'Nome': person.name,
              'ID': person.customId || '',
              'Saldo Final': `R$ ${person.balance.toFixed(2)}`,
              'Depósito': `R$ ${person.initialDeposit.toFixed(2)}`,
              'Data Compra': new Date(purchase.date).toLocaleDateString('pt-BR'),
              'Produto': item.productName,
              'Quantidade': item.quantity,
              'Valor': `R$ ${item.total.toFixed(2)}`,
              'Destino Saldo': person.balance > 0 ? (balanceAction === 'saque' ? 'Saque' : 'Missionário') : ''
            });
          });
        });
      }
    });
    
    const detailedCSV = Papa.unparse(detailedPeopleData);
    downloadCSV(detailedCSV, `encerramento-pessoas-completo-${timestamp}.csv`);
    reportsGenerated.push(`Pessoas Completo (${detailedPeopleData.length} registros)`);

    // 2. Produtos finais
    const productsData = products.map(product => ({
      'Nome': product.name,
      'Código': product.barcode || '',
      'Preço': `R$ ${product.price.toFixed(2)}`,
      'Estoque Final': product.stock,
      'Valor Estoque': `R$ ${(product.price * product.stock).toFixed(2)}`
    }));
    
    const productsCSV = Papa.unparse(productsData);
    downloadCSV(productsCSV, `encerramento-produtos-${timestamp}.csv`);
    reportsGenerated.push(`Produtos (${productsData.length} itens)`);

    // 3. Resumo de vendas
    const salesData = new Map<string, { quantity: number; total: number; name: string }>();
    let grandTotal = 0;
    let totalTransactions = 0;

    people.forEach(person => {
      person.purchases.forEach(purchase => {
        totalTransactions++;
        grandTotal += purchase.total;
        
        purchase.items.forEach(item => {
          if (salesData.has(item.productId)) {
            const existing = salesData.get(item.productId)!;
            existing.quantity += item.quantity;
            existing.total += item.total;
          } else {
            salesData.set(item.productId, {
              name: item.productName,
              quantity: item.quantity,
              total: item.total
            });
          }
        });
      });
    });

    const salesSummaryData = [
      {
        'Produto': '=== RESUMO FINAL ===',
        'Quantidade': totalTransactions,
        'Total Vendas': `R$ ${grandTotal.toFixed(2)}`,
        'Ticket Médio': `R$ ${totalTransactions > 0 ? (grandTotal / totalTransactions).toFixed(2) : '0.00'}`,
        'Saldos Restantes': `R$ ${totalPositiveBalance.toFixed(2)}`,
        'Destino Saldos': balanceAction === 'saque' ? 'Saque' : 'Missionário'
      },
      ...Array.from(salesData.values())
        .map(item => ({
          'Produto': item.name,
          'Quantidade': item.quantity,
          'Total Vendas': `R$ ${item.total.toFixed(2)}`,
          'Ticket Médio': `R$ ${(item.total / item.quantity).toFixed(2)}`,
          'Saldos Restantes': '',
          'Destino Saldos': ''
        }))
        .sort((a, b) => parseFloat(b['Total Vendas'].replace('R$ ', '')) - parseFloat(a['Total Vendas'].replace('R$ ', '')))
    ];

    const salesCSV = Papa.unparse(salesSummaryData);
    downloadCSV(salesCSV, `encerramento-resumo-vendas-${timestamp}.csv`);
    reportsGenerated.push(`Resumo de Vendas (R$ ${grandTotal.toFixed(2)})`);
  };

  const generateFinalReportsPDF = async (reportsGenerated: string[]) => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleDateString('pt-BR');
    const margin = 20;
    let yPosition = 25;

    // Header principal
    doc.setFontSize(18);
    doc.text('RELATÓRIO FINAL DE ENCERRAMENTO', margin, yPosition);
    doc.setFontSize(12);
    yPosition += 10;
    doc.text(`Data: ${timestamp}`, margin, yPosition);
    doc.text(`Destino dos Saldos: ${balanceAction === 'saque' ? 'Saque' : 'Doação para Missionário'}`, margin, yPosition + 10);
    yPosition += 25;

    // Resumo geral
    doc.setFontSize(14);
    doc.text('RESUMO GERAL', margin, yPosition);
    yPosition += 15;

    const summaryData = [
      ['Total de Pessoas', people.length.toString()],
      ['Pessoas com Saldo', peopleWithPositiveBalance.length.toString()],
      ['Total de Saldos', `R$ ${totalPositiveBalance.toFixed(2)}`],
      ['Total de Produtos', products.length.toString()],
      ['Produtos em Estoque', products.filter(p => p.stock > 0).length.toString()],
      ['Destino dos Saldos', balanceAction === 'saque' ? 'Saque' : 'Doação Missionário']
    ];

    autoTable(doc, {
      head: [['Item', 'Valor']],
      body: summaryData,
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Pessoas com saldo positivo (se houver)
    if (peopleWithPositiveBalance.length > 0) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }

      doc.setFontSize(14);
      doc.text('PESSOAS COM SALDO POSITIVO', margin, yPosition);
      yPosition += 10;

      const balanceData = peopleWithPositiveBalance.map(person => [
        person.name,
        person.customId || '',
        `R$ ${person.balance.toFixed(2)}`,
        balanceAction === 'saque' ? 'Saque' : 'Missionário'
      ]);

      autoTable(doc, {
        head: [['Nome', 'ID', 'Saldo', 'Destino']],
        body: balanceData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });
    }

    // Salvar PDF
    const fileName = `encerramento-final-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    reportsGenerated.push(`Relatório Final PDF`);
  };

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    setStep('confirm');
    setBalanceAction('saque');
    setResults(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={step === 'processing' ? undefined : handleClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={step === 'processing'}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Encerrar Acampamento
      </DialogTitle>
      
      <DialogContent>
        {step === 'confirm' && (
          <Stack spacing={3}>
            <Alert severity="warning">
              <Typography variant="h6" gutterBottom>
                ⚠️ ATENÇÃO: Esta ação não pode ser desfeita!
              </Typography>
              <Typography variant="body1">
                O encerramento do acampamento irá:
              </Typography>
              <ul>
                <li>Registrar no histórico de cada pessoa o destino do saldo</li>
                <li>Zerar todos os saldos das pessoas</li>
                <li>Zerar todo o estoque de produtos</li>
                <li>Gerar relatórios finais completos</li>
              </ul>
            </Alert>

            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                📊 Situação Atual:
              </Typography>
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pessoas:</Typography>
                  <Typography variant="h6">{people.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Com Saldo:</Typography>
                  <Typography variant="h6" color="primary">{peopleWithPositiveBalance.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Saldos:</Typography>
                  <Typography variant="h6" color="primary">R$ {totalPositiveBalance.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Produtos:</Typography>
                  <Typography variant="h6">{products.length}</Typography>
                </Box>
              </Stack>
            </Box>

            {peopleWithPositiveBalance.length > 0 && (
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>{peopleWithPositiveBalance.length} pessoas</strong> possuem saldo positivo totalizando <strong>R$ {totalPositiveBalance.toFixed(2)}</strong>.
                  <br />
                  Você precisará definir o destino desses saldos na próxima etapa.
                </Typography>
              </Alert>
            )}
          </Stack>
        )}

        {step === 'balance-choice' && (
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                💰 Destino dos Saldos Positivos
              </Typography>
              <Typography variant="body1">
                {peopleWithPositiveBalance.length} pessoas possuem saldo positivo (Total: R$ {totalPositiveBalance.toFixed(2)}).
                <br />
                Escolha o destino desses valores:
              </Typography>
            </Alert>

            <FormControl>
              <FormLabel>O que fazer com os saldos positivos?</FormLabel>
              <RadioGroup
                value={balanceAction}
                onChange={(e) => setBalanceAction(e.target.value as BalanceAction)}
              >
                <FormControlLabel
                  value="saque"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">💵 <strong>Permitir Saque</strong></Typography>
                      <Typography variant="body2" color="text.secondary">
                        Os saldos serão disponibilizados para saque pelas pessoas
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Será registrado no histórico como "Encerramento - Saldo para Saque"
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="missionario"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">🙏 <strong>Doação para Missionário</strong></Typography>
                      <Typography variant="body2" color="text.secondary">
                        Todos os saldos serão doados para o trabalho missionário
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Será registrado no histórico como "Encerramento - Saldo para Missionário"
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" gutterBottom>
                Pessoas com saldo positivo:
              </Typography>
              <List dense>
                {peopleWithPositiveBalance.slice(0, 5).map((person) => (
                  <ListItem key={person.id} sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`${person.name} ${person.customId ? `(${person.customId})` : ''}`}
                      secondary={`R$ ${person.balance.toFixed(2)}`}
                    />
                  </ListItem>
                ))}
                {peopleWithPositiveBalance.length > 5 && (
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText 
                      primary={`... e mais ${peopleWithPositiveBalance.length - 5} pessoas`}
                      secondary={`Total: R$ ${totalPositiveBalance.toFixed(2)}`}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          </Stack>
        )}

        {step === 'processing' && (
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Encerrando Acampamento...
              </Typography>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                {isProcessing 
                  ? 'Gerando relatórios finais e limpando dados...' 
                  : 'Processamento concluído!'
                }
              </Typography>
            </Box>
          </Stack>
        )}

        {step === 'completed' && results && (
          <Stack spacing={3}>
            <Alert severity="success">
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon /> Acampamento Encerrado com Sucesso!
              </Typography>
            </Alert>

            <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                📋 Resumo do Encerramento:
              </Typography>
              <Stack direction="row" spacing={4} sx={{ mb: 2 }}>
                <Chip label={`${results.peopleWithBalance} pessoas zeradas`} color="primary" />
                <Chip label={`R$ ${results.totalBalance.toFixed(2)} ${balanceAction === 'saque' ? 'para saque' : 'para missionário'}`} color="secondary" />
                <Chip label={`${results.productsCleared} produtos zerados`} color="default" />
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                📄 Relatórios Gerados:
              </Typography>
              <List dense>
                {results.reportsGenerated.map((report, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={`✅ ${report}`}
                      sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                Os arquivos foram baixados automaticamente. 
                Todos os saldos e estoques foram zerados no sistema.
              </Typography>
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        {step === 'confirm' && (
          <>
            <Button onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              color="warning"
              onClick={handleConfirmStart}
            >
              Prosseguir com Encerramento
            </Button>
          </>
        )}

        {step === 'balance-choice' && (
          <>
            <Button onClick={() => setStep('confirm')}>
              Voltar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleBalanceChoice}
            >
              Confirmar e Encerrar
            </Button>
          </>
        )}

        {step === 'processing' && (
          <Button disabled>
            Processando...
          </Button>
        )}

        {step === 'completed' && (
          <Button 
            variant="contained" 
            onClick={handleClose}
            color="success"
          >
            Finalizar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};