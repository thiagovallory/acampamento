import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import Quagga from 'quagga';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scannerRef.current && !isScanning) {
      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        },
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'code_128_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader'
          ]
        },
        locate: true,
        locator: {
          patchSize: 'medium',
          halfSample: true
        }
      }, (err: any) => {
        if (err) {
          console.error('Erro ao inicializar scanner:', err);
          setError('Erro ao acessar a câmera. Verifique as permissões.');
          return;
        }
        Quagga.start();
        setIsScanning(true);
      });

      Quagga.onDetected((result: any) => {
        if (result?.codeResult?.code) {
          onScan(result.codeResult.code);
          Quagga.stop();
          setIsScanning(false);
        }
      });
    }

    return () => {
      if (isScanning) {
        Quagga.stop();
      }
    };
  }, [onScan, isScanning]);

  if (error) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <Paper sx={{ p: 3, m: 2, maxWidth: 400, textAlign: 'center', position: 'relative' }}>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <Close />
          </IconButton>
          <Typography color="error" gutterBottom variant="h6">
            Erro no Scanner
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Certifique-se de que o navegador tem permissão para acessar a câmera<br/>
            • Tente usar HTTPS se estiver em um servidor local<br/>
            • Verifique se a câmera não está sendo usada por outro app
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      p: 2
    }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          bgcolor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.3)'
          }
        }}
      >
        <Close />
      </IconButton>
      
      <Box sx={{
        width: '100%',
        maxWidth: 640,
        height: 480,
        position: 'relative',
        border: '2px solid white',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'black'
      }}>
        <div 
          ref={scannerRef} 
          style={{ 
            width: '100%', 
            height: '100%'
          }} 
        />
        
        {/* Overlay com frame de scanning */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <Box sx={{
            width: 250,
            height: 150,
            border: '3px solid #ff4444',
            borderRadius: 1,
            position: 'relative',
            backgroundColor: 'transparent'
          }}>
            {/* Cantos do frame */}
            <Box sx={{
              position: 'absolute',
              top: -3,
              left: -3,
              width: 20,
              height: 20,
              borderTop: '6px solid #ff4444',
              borderLeft: '6px solid #ff4444'
            }} />
            <Box sx={{
              position: 'absolute',
              top: -3,
              right: -3,
              width: 20,
              height: 20,
              borderTop: '6px solid #ff4444',
              borderRight: '6px solid #ff4444'
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -3,
              left: -3,
              width: 20,
              height: 20,
              borderBottom: '6px solid #ff4444',
              borderLeft: '6px solid #ff4444'
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -3,
              right: -3,
              width: 20,
              height: 20,
              borderBottom: '6px solid #ff4444',
              borderRight: '6px solid #ff4444'
            }} />
          </Box>
        </Box>
      </Box>
      
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'white', 
          mt: 3, 
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0,0,0,0.8)'
        }}
      >
        Posicione o código de barras dentro do quadro vermelho
      </Typography>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'rgba(255,255,255,0.8)', 
          mt: 1, 
          textAlign: 'center',
          textShadow: '0 0 10px rgba(0,0,0,0.8)'
        }}
      >
        Mantenha o código bem iluminado e centralizado
      </Typography>
    </Box>
  );
};