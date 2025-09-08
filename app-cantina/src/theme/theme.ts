import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#006495",
      light: "#4990c2",
      dark: "#003c5f",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#535f70",
      light: "#7b879a",
      dark: "#3c4855",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ba1a1a",
      light: "#e44949",
      dark: "#8c0009",
    },
    background: {
      default: "#fdfcff",
      paper: "#fdfcff",
    },
    surface: {
      main: "#fdfcff",
      variant: "#dfe2eb",
    },
    tertiary: {
      main: "#834781",
      light: "#9a7da1",
      dark: "#773b75",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.125rem",
      fontWeight: 400,
      lineHeight: 1.235,
    },
    h2: {
      fontSize: "1.5rem",
      fontWeight: 500,
      lineHeight: 1.334,
    },
    h3: {
      fontSize: "1.25rem",
      fontWeight: 500,
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: "0.875rem",
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.3)",
          },
        },
        contained: {
          "&:hover": {
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.4)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
          "&:hover": {
            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0px 3px 12px rgba(0, 0, 0, 0.15)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

declare module "@mui/material/styles" {
  interface Palette {
    surface: {
      main: string;
      variant: string;
    };
    tertiary: {
      main: string;
      light: string;
      dark: string;
    };
  }
  interface PaletteOptions {
    surface?: {
      main?: string;
      variant?: string;
    };
    tertiary?: {
      main?: string;
      light?: string;
      dark?: string;
    };
  }
}
