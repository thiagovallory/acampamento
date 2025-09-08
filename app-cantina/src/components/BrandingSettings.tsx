import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Avatar,
  IconButton,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';

interface BrandingSettingsProps {
  open: boolean;
  onClose: () => void;
}

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ open, onClose }) => {
  const { branding, updateBranding } = useApp();
  const [organizationName, setOrganizationName] = useState(branding.organizationName);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [showLogo, setShowLogo] = useState(branding.showLogo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateBranding({
      organizationName,
      logoUrl,
      showLogo
    });
    onClose();
  };

  const handleCancel = () => {
    // Resetar para valores originais
    setOrganizationName(branding.organizationName);
    setLogoUrl(branding.logoUrl);
    setShowLogo(branding.showLogo);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Criar URL do arquivo local
      const fileUrl = URL.createObjectURL(file);
      setLogoUrl(fileUrl);
    }
  };

  const handleUseDefaultLogo = () => {
    setLogoUrl('/LOGO.png');
  };

  const resetToDefaults = () => {
    setOrganizationName('Acampamento de Jovens 2025');
    setLogoUrl('/LOGO.png');
    setShowLogo(true);
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleCancel}
        maxWidth="md"
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
          ⚙️ Configurações de Identidade Visual
          <IconButton onClick={handleCancel} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure o nome da organização e logotipo que aparecerão nos relatórios e cabeçalho da aplicação.
          </Typography>

          <Stack spacing={3}>
            {/* Nome da Organização */}
            <TextField
              label="Nome da Organização"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              fullWidth
              variant="outlined"
              helperText="Este nome aparecerá nos relatórios e no cabeçalho"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <Divider />

            {/* Logo Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Logotipo
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                  />
                }
                label="Mostrar logotipo nos relatórios"
                sx={{ mb: 2 }}
              />

              {showLogo && (
                <Stack spacing={2}>
                  {/* Preview do Logo */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }}>
                    <Avatar
                      src={logoUrl}
                      alt="Logo Preview"
                      sx={{ 
                        width: 60, 
                        height: 60,
                        bgcolor: 'primary.main'
                      }}
                    >
                      📋
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" fontWeight={500}>
                        Preview do Logo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {logoUrl.includes('blob:') ? 'Arquivo local selecionado' : logoUrl}
                      </Typography>
                    </Box>
                  </Box>

                  {/* URL do Logo */}
                  <TextField
                    label="URL do Logotipo"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    fullWidth
                    variant="outlined"
                    helperText="Caminho para o arquivo de imagem (ex: /logo.png)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />

                  {/* Botões de Ação */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ borderRadius: 4 }}
                    >
                      Enviar Imagem
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleUseDefaultLogo}
                      sx={{ borderRadius: 4 }}
                    >
                      Usar Logo Padrão
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Botão Reset */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="text"
                startIcon={<RefreshIcon />}
                onClick={resetToDefaults}
                sx={{ borderRadius: 4 }}
              >
                Restaurar Configurações Padrão
              </Button>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            sx={{ borderRadius: 4 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 4 }}
          >
            Salvar Configurações
          </Button>
        </DialogActions>
      </Dialog>

      {/* Input para upload de arquivo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </>
  );
};