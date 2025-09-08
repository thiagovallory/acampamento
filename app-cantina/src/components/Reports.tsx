import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Print as PrintIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useApp } from '../context/AppContext';

interface ReportsProps {
  open: boolean;
  onClose: () => void;
}

type ReportType = 'people-simple' | 'people-detailed' | 'products' | 'sales-summary';
type OutputFormat = 'csv' | 'pdf';

export const Reports: React.FC<ReportsProps> = ({ open, onClose }) => {
  const { people, products } = useApp();
  const [selectedReport, setSelectedReport] = useState<ReportType>('people-simple');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('csv');

  const generatePeopleSimpleCSV = () => {
    const csvData = people.map(person => ({
      'Nome': person.name,
      'ID Personalizado': person.customId || '',
      'Saldo Atual': `R$ ${person.balance.toFixed(2)}`,
      'Depósito Inicial': `R$ ${person.initialDeposit.toFixed(2)}`,
      'Total Compras': person.purchases.length
    }));

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, 'pessoas-simples.csv');
  };

  const generatePeopleDetailedCSV = () => {
    const csvData: any[] = [];
    
    people.forEach(person => {
      if (person.purchases.length === 0) {
        csvData.push({
          'Nome': person.name,
          'ID Personalizado': person.customId || '',
          'Saldo': `R$ ${person.balance.toFixed(2)}`,
          'Data Compra': '',
          'Produto': 'Nenhuma compra',
          'Quantidade': '',
          'Valor': ''
        });
      } else {
        person.purchases.forEach(purchase => {
          purchase.items.forEach(item => {
            csvData.push({
              'Nome': person.name,
              'ID Personalizado': person.customId || '',
              'Saldo': `R$ ${person.balance.toFixed(2)}`,
              'Data Compra': new Date(purchase.date).toLocaleDateString('pt-BR'),
              'Produto': item.productName,
              'Quantidade': item.quantity,
              'Valor': `R$ ${item.total.toFixed(2)}`
            });
          });
        });
      }
    });

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, 'pessoas-detalhadas.csv');
  };

  const generateProductsCSV = () => {
    const csvData = products.map(product => ({
      'Nome': product.name,
      'Código de Barras': product.barcode || '',
      'Preço': `R$ ${product.price.toFixed(2)}`,
      'Estoque': product.stock,
      'Valor Total Estoque': `R$ ${(product.price * product.stock).toFixed(2)}`
    }));

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, 'produtos.csv');
  };

  const generateSalesSummaryCSV = () => {
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

    const csvData = Array.from(salesData.values())
      .map(item => ({
        'Produto': item.name,
        'Quantidade Vendida': item.quantity,
        'Total Vendas': `R$ ${item.total.toFixed(2)}`,
        'Ticket Médio': `R$ ${(item.total / item.quantity).toFixed(2)}`
      }))
      .sort((a, b) => parseFloat(b['Total Vendas'].replace('R$ ', '')) - parseFloat(a['Total Vendas'].replace('R$ ', '')));

    // Add summary row
    csvData.unshift({
      'Produto': '=== RESUMO GERAL ===',
      'Quantidade Vendida': totalTransactions,
      'Total Vendas': `R$ ${grandTotal.toFixed(2)}`,
      'Ticket Médio': totalTransactions > 0 ? `R$ ${(grandTotal / totalTransactions).toFixed(2)}` : 'R$ 0.00'
    });

    const csv = Papa.unparse(csvData);
    downloadCSV(csv, 'resumo-vendas.csv');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;

    // Header
    doc.setFontSize(18);
    doc.text('Sistema de Cantina - Relatório', margin, 25);
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, margin, 35);

    let yPosition = 50;

    switch (selectedReport) {
      case 'people-simple':
        doc.setFontSize(14);
        doc.text('Lista de Pessoas', margin, yPosition);
        yPosition += 10;

        const peopleData = people.map(person => [
          person.name,
          person.customId || '',
          `R$ ${person.balance.toFixed(2)}`,
          `R$ ${person.initialDeposit.toFixed(2)}`,
          person.purchases.length.toString()
        ]);

        autoTable(doc, {
          head: [['Nome', 'ID', 'Saldo', 'Depósito', 'Compras']],
          body: peopleData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        break;

      case 'people-detailed':
        doc.setFontSize(14);
        doc.text('Pessoas com Detalhes de Compras', margin, yPosition);
        yPosition += 10;

        const detailedData: any[] = [];
        people.forEach(person => {
          if (person.purchases.length === 0) {
            detailedData.push([
              person.name,
              person.customId || '',
              `R$ ${person.balance.toFixed(2)}`,
              '',
              'Nenhuma compra',
              '',
              ''
            ]);
          } else {
            person.purchases.forEach(purchase => {
              purchase.items.forEach(item => {
                detailedData.push([
                  person.name,
                  person.customId || '',
                  `R$ ${person.balance.toFixed(2)}`,
                  new Date(purchase.date).toLocaleDateString('pt-BR'),
                  item.productName,
                  item.quantity.toString(),
                  `R$ ${item.total.toFixed(2)}`
                ]);
              });
            });
          }
        });

        autoTable(doc, {
          head: [['Nome', 'ID', 'Saldo', 'Data', 'Produto', 'Qtd', 'Valor']],
          body: detailedData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        break;

      case 'products':
        doc.setFontSize(14);
        doc.text('Lista de Produtos', margin, yPosition);
        yPosition += 10;

        const productsData = products.map(product => [
          product.name,
          product.barcode || '',
          `R$ ${product.price.toFixed(2)}`,
          product.stock.toString(),
          `R$ ${(product.price * product.stock).toFixed(2)}`
        ]);

        autoTable(doc, {
          head: [['Nome', 'Código', 'Preço', 'Estoque', 'Valor Total']],
          body: productsData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        break;

      case 'sales-summary':
        doc.setFontSize(14);
        doc.text('Resumo de Vendas', margin, yPosition);
        yPosition += 10;

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

        // Summary info
        doc.text(`Total de Transações: ${totalTransactions}`, margin, yPosition);
        doc.text(`Faturamento Total: R$ ${grandTotal.toFixed(2)}`, margin, yPosition + 10);
        doc.text(`Ticket Médio: R$ ${totalTransactions > 0 ? (grandTotal / totalTransactions).toFixed(2) : '0.00'}`, margin, yPosition + 20);
        yPosition += 35;

        const salesTableData = Array.from(salesData.values())
          .map(item => [
            item.name,
            item.quantity.toString(),
            `R$ ${item.total.toFixed(2)}`,
            `R$ ${(item.total / item.quantity).toFixed(2)}`
          ])
          .sort((a, b) => parseFloat(b[2].replace('R$ ', '')) - parseFloat(a[2].replace('R$ ', '')));

        autoTable(doc, {
          head: [['Produto', 'Quantidade', 'Total', 'Ticket Médio']],
          body: salesTableData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { fontSize: 10 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        break;
    }

    // Save PDF
    const fileName = `relatorio-${selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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

  const handleGenerate = () => {
    if (outputFormat === 'csv') {
      switch (selectedReport) {
        case 'people-simple':
          generatePeopleSimpleCSV();
          break;
        case 'people-detailed':
          generatePeopleDetailedCSV();
          break;
        case 'products':
          generateProductsCSV();
          break;
        case 'sales-summary':
          generateSalesSummaryCSV();
          break;
      }
    } else {
      generatePDF();
    }
  };

  const getReportDescription = () => {
    switch (selectedReport) {
      case 'people-simple':
        return 'Lista simples com nome, ID, saldo atual e número de compras';
      case 'people-detailed':
        return 'Lista completa com histórico detalhado de todas as compras';
      case 'products':
        return 'Lista de produtos com preços, estoque e valores';
      case 'sales-summary':
        return 'Resumo das vendas por produto com totais e estatísticas';
      default:
        return '';
    }
  };

  const reports = [
    {
      id: 'people-simple',
      title: 'Pessoas - Lista Simples',
      description: 'Lista básica de pessoas com saldo e informações principais',
      icon: <PeopleIcon />
    },
    {
      id: 'people-detailed',
      title: 'Pessoas - Com Histórico',
      description: 'Lista completa com histórico detalhado de compras',
      icon: <PeopleIcon />
    },
    {
      id: 'products',
      title: 'Produtos Completo',
      description: 'Lista de produtos com preços, estoque e valores totais',
      icon: <InventoryIcon />
    },
    {
      id: 'sales-summary',
      title: 'Resumo de Vendas',
      description: 'Estatísticas de vendas por produto e totais gerais',
      icon: <AssessmentIcon />
    }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon />
          Gerar Relatórios
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          <Alert severity="info">
            Selecione o tipo de relatório e formato desejado. Os arquivos serão baixados automaticamente.
          </Alert>

          <Box>
            <Typography variant="h6" gutterBottom>
              Tipo de Relatório
            </Typography>
            <Stack spacing={2}>
              {reports.map((report) => (
                <Card
                  key={report.id}
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    border: selectedReport === report.id ? 2 : 1,
                    borderColor: selectedReport === report.id ? 'primary.main' : 'divider',
                    bgcolor: selectedReport === report.id ? 'primary.50' : 'background.paper'
                  }}
                  onClick={() => setSelectedReport(report.id as ReportType)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {report.icon}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {report.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <FormControl>
              <FormLabel>Formato de Saída</FormLabel>
              <RadioGroup
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                row
              >
                <FormControlLabel
                  value="csv"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FileDownloadIcon fontSize="small" />
                      CSV (Excel)
                    </Box>
                  }
                />
                <FormControlLabel
                  value="pdf"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PrintIcon fontSize="small" />
                      PDF (Imprimir)
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Alert severity="success">
            <Typography variant="body2">
              <strong>Relatório selecionado:</strong> {getReportDescription()}
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          startIcon={outputFormat === 'csv' ? <FileDownloadIcon /> : <PrintIcon />}
        >
          {outputFormat === 'csv' ? 'Baixar CSV' : 'Gerar PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};