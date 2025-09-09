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
  const { people, products, branding } = useApp();
  const [selectedReport, setSelectedReport] = useState<ReportType>('people-simple');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('csv');

  // Remove emojis do texto para PDF
  const cleanTextForPDF = (text: string): string => {
    // Remove emojis e caracteres especiais que não são suportados pelo PDF
    return text.replace(/[\u{1F300}-\u{1FAD6}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  const generatePeopleSimpleCSV = () => {
    const csvData = people.map(person => ({
      'ID Personalizado': person.customId ? `="${person.customId}"` : '', // Força texto
      'Nome': person.name,
      'Saldo Atual': person.balance.toFixed(2),
      'Depósito Inicial': person.initialDeposit.toFixed(2),
      'Total Compras': person.purchases.length
    }));

    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const orgSlug = branding.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    downloadCSV(csv, `${orgSlug}-pessoas-simples.csv`);
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
              'ID Personalizado': person.customId ? `="${person.customId}"` : '',
              'Nome': person.name,
              'Saldo': person.balance.toFixed(2),
              'Data Compra': new Date(purchase.date).toLocaleDateString('pt-BR'),
              'Produto': cleanTextForPDF(item.productName), // Remove emojis como no PDF
              'Quantidade': item.quantity,
              'Valor': item.total.toFixed(2)
            });
          });
        });
      }
    });

    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const orgSlug = branding.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    downloadCSV(csv, `${orgSlug}-pessoas-detalhadas.csv`);
  };

  const generateProductsCSV = () => {
    // Calcula vendas por produto (igual ao PDF)
    const salesByProduct = new Map<string, { quantity: number; total: number }>();
    people.forEach(person => {
      person.purchases.forEach(purchase => {
        purchase.items.forEach(item => {
          if (salesByProduct.has(item.productId)) {
            const existing = salesByProduct.get(item.productId)!;
            existing.quantity += item.quantity;
            existing.total += item.total;
          } else {
            salesByProduct.set(item.productId, {
              quantity: item.quantity,
              total: item.total
            });
          }
        });
      });
    });

    const csvData = products.map(product => {
      const sales = salesByProduct.get(product.id) || { quantity: 0, total: 0 };
      return {
        'Código': product.barcode ? `="${product.barcode}"` : '', // Força texto com =
        'Produto': product.name,
        'Qtd Comprada': product.purchasedQuantity || 0,
        'Custo': product.costPrice ? product.costPrice.toFixed(2) : '',
        'Preço': product.price.toFixed(2),
        'Vendidos': sales.quantity,
        'Valor Total Vendido': sales.total.toFixed(2),
        'Estoque': product.stock
      };
    });

    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const orgSlug = branding.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    downloadCSV(csv, `${orgSlug}-produtos.csv`);
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
        'Produto': cleanTextForPDF(item.name), // Remove emojis como no PDF
        'Quantidade': item.quantity,
        'Total': item.total.toFixed(2),
        'Ticket Médio': (item.total / item.quantity).toFixed(2)
      }))
      .sort((a, b) => parseFloat(b['Total']) - parseFloat(a['Total']));

    // Add summary row
    csvData.unshift({
      'Produto': '=== RESUMO GERAL ===',
      'Quantidade': totalTransactions,
      'Total': grandTotal.toFixed(2),
      'Ticket Médio': totalTransactions > 0 ? (grandTotal / totalTransactions).toFixed(2) : '0.00'
    });

    const csv = Papa.unparse(csvData, { delimiter: ';' });
    const orgSlug = branding.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    downloadCSV(csv, `${orgSlug}-resumo-vendas.csv`);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let yPosition = 20;

    // Adiciona logo centralizada se disponível
    if (branding.showLogo && branding.logoUrl) {
      try {
        // Se for URL absoluta ou relativa
        const logoUrl = branding.logoUrl.startsWith('http') || branding.logoUrl.startsWith('blob:') 
          ? branding.logoUrl 
          : window.location.origin + branding.logoUrl;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = logoUrl;
        });

        // Calcula proporções mantendo aspect ratio
        const maxLogoHeight = 35;
        const maxLogoWidth = 60;
        
        // Calcula as dimensões mantendo a proporção
        const imgRatio = img.width / img.height;
        let logoWidth = maxLogoWidth;
        let logoHeight = maxLogoWidth / imgRatio;
        
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = maxLogoHeight * imgRatio;
        }
        
        // Centraliza a logo horizontalmente
        const logoX = (pageWidth - logoWidth) / 2;
        
        // Adiciona a imagem ao PDF centralizada
        doc.addImage(img, 'PNG', logoX, yPosition, logoWidth, logoHeight);
        
        // Ajusta yPosition baseado na altura da logo
        yPosition += logoHeight + 10;
      } catch (error) {
        // Se falhar ao carregar a logo, continua sem ela
        console.error('Erro ao carregar logo:', error);
      }
    }
    
    // Nome da organização centralizado
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    const orgNameWidth = doc.getTextWidth(branding.organizationName);
    doc.text(branding.organizationName, (pageWidth - orgNameWidth) / 2, yPosition);
    
    yPosition += 10;
    
    // Título do relatório centralizado
    doc.setFontSize(18);
    doc.setFont(undefined, 'normal');
    const reportTitle = 'Sistema de Cantina - Relatório de Vendas';
    const titleWidth = doc.getTextWidth(reportTitle);
    doc.text(reportTitle, (pageWidth - titleWidth) / 2, yPosition);
    
    yPosition += 8;
    
    // Data centralizada
    doc.setFontSize(12);
    const dateText = new Date().toLocaleDateString('pt-BR');
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, yPosition);

    yPosition += 20;

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
                  cleanTextForPDF(item.productName),
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

        // Calcula vendas por produto
        const salesByProduct = new Map<string, { quantity: number; total: number }>();
        people.forEach(person => {
          person.purchases.forEach(purchase => {
            purchase.items.forEach(item => {
              if (salesByProduct.has(item.productId)) {
                const existing = salesByProduct.get(item.productId)!;
                existing.quantity += item.quantity;
                existing.total += item.total;
              } else {
                salesByProduct.set(item.productId, {
                  quantity: item.quantity,
                  total: item.total
                });
              }
            });
          });
        });

        const productsData = products.map(product => {
          const sales = salesByProduct.get(product.id) || { quantity: 0, total: 0 };
          return [
            product.barcode || '-',
            product.name,
            product.purchasedQuantity?.toString() || '0',
            product.costPrice ? `R$ ${product.costPrice.toFixed(2)}` : '-',
            `R$ ${product.price.toFixed(2)}`,
            sales.quantity.toString(),
            `R$ ${sales.total.toFixed(2)}`,
            product.stock.toString()
          ];
        });

        autoTable(doc, {
          head: [['Código', 'Produto', 'QTD', 'Custo', 'Preço', 'VEN', 'VTV', 'EST']],
          body: productsData,
          startY: yPosition,
          margin: { left: margin, right: margin },
          styles: { 
            fontSize: 10,  
            cellPadding: 2,
          },
          headStyles: { 
            fillColor: [66, 139, 202],
            fontSize: 10,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Código
            1: { cellWidth: 45 }, // Produto
            2: { cellWidth: 12 }, // Qtd Comprada
            3: { cellWidth: 22 }, // Custo
            4: { cellWidth: 22 }, // Preço
            5: { cellWidth: 12 }, // Vendidos
            6: { cellWidth: 22 }, // Valor Total Vendido
            7: { cellWidth: 12 }  // Estoque
          }
        });
        break;

      case 'sales-summary':
        

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
            cleanTextForPDF(item.name),
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
    const orgSlug = branding.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const fileName = `${orgSlug}-relatorio-${selectedReport}-${new Date().toISOString().split('T')[0]}.pdf`;
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