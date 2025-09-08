import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Person, Product, Purchase, PurchaseItem, BrandingConfig } from '../types/index';

interface AppContextType {
  people: Person[];
  products: Product[];
  branding: BrandingConfig;
  addPerson: (person: Omit<Person, 'id' | 'purchases'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addPurchase: (personId: string, items: PurchaseItem[]) => void;
  deletePurchase: (personId: string, purchaseId: string) => void;
  deletePurchaseItem: (personId: string, purchaseId: string, productId: string) => void;
  updatePurchaseItemQuantity: (personId: string, purchaseId: string, productId: string, newQuantity: number) => void;
  getPersonById: (id: string) => Person | undefined;
  getProductById: (id: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;
  importProductsFromCSV: (csvData: any[], onConflict: (product: any, existing: Product) => boolean) => Promise<{ imported: number; updated: number; errors: string[] }>;
  importPeopleFromCSV: (csvData: any[]) => Promise<{ imported: number; errors: string[] }>;
  encerrarAcampamento: (balanceAction: 'saque' | 'missionario') => Promise<void>;
  updateBranding: (branding: Partial<BrandingConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [people, setPeople] = useState<Person[]>(() => {
    const saved = localStorage.getItem('cantina_people');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cantina_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const saved = localStorage.getItem('cantina_branding');
    return saved ? JSON.parse(saved) : {
      organizationName: 'Acampamento de Jovens 2025',
      logoUrl: '/LOGO.png',
      showLogo: true
    };
  });

  useEffect(() => {
    localStorage.setItem('cantina_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('cantina_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cantina_branding', JSON.stringify(branding));
  }, [branding]);

  const addPerson = (person: Omit<Person, 'id' | 'purchases'>) => {
    const newPerson: Person = {
      ...person,
      id: Date.now().toString(),
      balance: person.initialDeposit,
      purchases: []
    };
    setPeople(prev => [...prev, newPerson]);
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString()
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addPurchase = (personId: string, items: PurchaseItem[]) => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const purchase: Purchase = {
      id: Date.now().toString(),
      personId,
      date: new Date(),
      items,
      total
    };

    setPeople(prev => prev.map(person => {
      if (person.id === personId) {
        const newBalance = person.balance - total;
        return {
          ...person,
          balance: newBalance,
          purchases: [...person.purchases, purchase]
        };
      }
      return person;
    }));

    setProducts(prev => prev.map(product => {
      const item = items.find(i => i.productId === product.id);
      if (item) {
        return {
          ...product,
          stock: product.stock - item.quantity
        };
      }
      return product;
    }));
  };

  const deletePurchase = (personId: string, purchaseId: string) => {
    setPeople(prev => prev.map(person => {
      if (person.id === personId) {
        const purchase = person.purchases.find(p => p.id === purchaseId);
        if (purchase) {
          // Restaura o saldo e o estoque
          const newBalance = person.balance + purchase.total;
          
          // Restaura o estoque dos produtos
          setProducts(prevProducts => prevProducts.map(product => {
            const item = purchase.items.find(i => i.productId === product.id);
            if (item) {
              return {
                ...product,
                stock: product.stock + item.quantity
              };
            }
            return product;
          }));
          
          return {
            ...person,
            balance: newBalance,
            purchases: person.purchases.filter(p => p.id !== purchaseId)
          };
        }
      }
      return person;
    }));
  };

  const deletePurchaseItem = (personId: string, purchaseId: string, productId: string) => {
    setPeople(prev => prev.map(person => {
      if (person.id === personId) {
        const purchaseIndex = person.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex !== -1) {
          const purchase = person.purchases[purchaseIndex];
          const item = purchase.items.find(i => i.productId === productId);
          
          if (item) {
            // Restaura o saldo
            const newBalance = person.balance + item.total;
            
            // Restaura o estoque
            setProducts(prevProducts => prevProducts.map(product => {
              if (product.id === productId) {
                return {
                  ...product,
                  stock: product.stock + item.quantity
                };
              }
              return product;
            }));
            
            // Remove o item ou a compra inteira se for o último item
            const newItems = purchase.items.filter(i => i.productId !== productId);
            
            if (newItems.length === 0) {
              // Remove a compra inteira se não tiver mais itens
              return {
                ...person,
                balance: newBalance,
                purchases: person.purchases.filter(p => p.id !== purchaseId)
              };
            } else {
              // Atualiza a compra com o novo total
              const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
              const updatedPurchase = {
                ...purchase,
                items: newItems,
                total: newTotal
              };
              
              const newPurchases = [...person.purchases];
              newPurchases[purchaseIndex] = updatedPurchase;
              
              return {
                ...person,
                balance: newBalance,
                purchases: newPurchases
              };
            }
          }
        }
      }
      return person;
    }));
  };

  const updatePurchaseItemQuantity = (personId: string, purchaseId: string, productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      deletePurchaseItem(personId, purchaseId, productId);
      return;
    }
    
    setPeople(prev => prev.map(person => {
      if (person.id === personId) {
        const purchaseIndex = person.purchases.findIndex(p => p.id === purchaseId);
        if (purchaseIndex !== -1) {
          const purchase = person.purchases[purchaseIndex];
          const itemIndex = purchase.items.findIndex(i => i.productId === productId);
          
          if (itemIndex !== -1) {
            const item = purchase.items[itemIndex];
            const quantityDiff = newQuantity - item.quantity;
            const product = products.find(p => p.id === productId);
            
            if (product) {
              // Verifica se há estoque suficiente para aumentar a quantidade
              if (quantityDiff > 0 && quantityDiff > product.stock) {
                alert(`Estoque insuficiente! Disponível: ${product.stock}`);
                return person;
              }
              
              // Atualiza o estoque
              setProducts(prevProducts => prevProducts.map(p => {
                if (p.id === productId) {
                  return {
                    ...p,
                    stock: p.stock - quantityDiff
                  };
                }
                return p;
              }));
              
              // Calcula o novo total do item
              const newItemTotal = Math.round(item.price * newQuantity * 100) / 100;
              const totalDiff = newItemTotal - item.total;
              
              // Atualiza o item
              const newItems = [...purchase.items];
              newItems[itemIndex] = {
                ...item,
                quantity: newQuantity,
                total: newItemTotal
              };
              
              // Atualiza o total da compra
              const newPurchaseTotal = Math.round((purchase.total + totalDiff) * 100) / 100;
              
              const updatedPurchase = {
                ...purchase,
                items: newItems,
                total: newPurchaseTotal
              };
              
              const newPurchases = [...person.purchases];
              newPurchases[purchaseIndex] = updatedPurchase;
              
              // Atualiza o saldo da pessoa
              const newBalance = Math.round((person.balance - totalDiff) * 100) / 100;
              
              return {
                ...person,
                balance: newBalance,
                purchases: newPurchases
              };
            }
          }
        }
      }
      return person;
    }));
  };

  const getPersonById = (id: string) => people.find(p => p.id === id);
  const getProductById = (id: string) => products.find(p => p.id === id);
  const getProductByBarcode = (barcode: string) => products.find(p => p.barcode === barcode);

  const importProductsFromCSV = async (
    csvData: any[], 
    onConflict: (product: any, existing: Product) => boolean
  ) => {
    const results = { imported: 0, updated: 0, errors: [] as string[] };
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Validate required fields
        if (!row.name || !row.price) {
          results.errors.push(`Linha ${i + 2}: Nome e preço são obrigatórios`);
          continue;
        }

        const price = parseFloat(row.price);
        const stock = parseInt(row.stock || '0');
        
        if (isNaN(price) || price < 0) {
          results.errors.push(`Linha ${i + 2}: Preço inválido`);
          continue;
        }

        if (isNaN(stock) || stock < 0) {
          results.errors.push(`Linha ${i + 2}: Estoque inválido`);
          continue;
        }

        // Check if product exists by barcode
        const existingProduct = row.barcode ? getProductByBarcode(row.barcode.toString()) : null;
        
        if (existingProduct) {
          // Product exists, ask for confirmation
          if (onConflict(row, existingProduct)) {
            updateProduct(existingProduct.id, {
              name: row.name,
              price: price,
              stock: stock,
              barcode: row.barcode?.toString()
            });
            results.updated++;
          }
        } else {
          // New product
          addProduct({
            name: row.name,
            barcode: row.barcode?.toString(),
            price: price,
            stock: stock
          });
          results.imported++;
        }
      } catch (error) {
        results.errors.push(`Linha ${i + 2}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return results;
  };

  const importPeopleFromCSV = async (csvData: any[]) => {
    const results = { imported: 0, errors: [] as string[] };
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Validate required fields
        if (!row.name) {
          results.errors.push(`Linha ${i + 2}: Nome é obrigatório`);
          continue;
        }

        const initialDeposit = parseFloat(row.initialDeposit || row.deposito || '0');
        
        if (isNaN(initialDeposit) || initialDeposit < 0) {
          results.errors.push(`Linha ${i + 2}: Depósito inicial inválido`);
          continue;
        }

        // Check if person already exists by name
        const existingPerson = people.find(p => 
          p.name.toLowerCase() === row.name.toLowerCase()
        );
        
        if (existingPerson) {
          results.errors.push(`Linha ${i + 2}: Pessoa "${row.name}" já existe no sistema`);
          continue;
        }

        // Add new person
        addPerson({
          name: row.name,
          customId: row.customId || row.codigo || undefined,
          initialDeposit: initialDeposit,
          photo: row.photo || row.foto || undefined,
          balance: initialDeposit
        });
        results.imported++;
      } catch (error) {
        results.errors.push(`Linha ${i + 2}: Erro ao processar - ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return results;
  };

  const encerrarAcampamento = async (balanceAction: 'saque' | 'missionario') => {
    const encerramentoDate = new Date();
    
    // Criar histórico de encerramento antes de limpar os dados
    const encerramentoData = {
      data: encerramentoDate.toISOString(),
      balanceAction,
      peopleCount: people.length,
      peopleWithBalance: people.filter(p => p.balance > 0).length,
      totalBalance: people.reduce((sum, p) => sum + p.balance, 0),
      productsCount: products.length,
      productsWithStock: products.filter(p => p.stock > 0).length,
      people: people.map(p => ({
        id: p.id,
        name: p.name,
        customId: p.customId,
        finalBalance: p.balance,
        initialDeposit: p.initialDeposit,
        totalPurchases: p.purchases.length,
        totalSpent: p.purchases.reduce((sum, purchase) => sum + purchase.total, 0)
      })),
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        finalStock: p.stock,
        price: p.price
      }))
    };

    // Salvar histórico no localStorage
    localStorage.setItem('cantina_encerramento_history', JSON.stringify(encerramentoData));

    // Atualizar pessoas: adicionar registro de encerramento no histórico e zerar saldo
    setPeople(prev => prev.map(person => {
      // Se a pessoa tem saldo positivo, adicionar registro no histórico
      if (person.balance > 0) {
        const encerramentoPurchase: Purchase = {
          id: `encerramento-${Date.now()}-${person.id}`,
          personId: person.id,
          date: encerramentoDate,
          items: [{
            productId: 'encerramento',
            productName: balanceAction === 'saque' 
              ? '💵 Encerramento - Saldo para Saque' 
              : '🙏 Encerramento - Saldo para Missionário',
            quantity: 1,
            price: person.balance,
            total: person.balance
          }],
          total: person.balance
        };

        return {
          ...person,
          balance: 0,
          purchases: [...person.purchases, encerramentoPurchase]
        };
      }
      
      // Se não tem saldo, apenas retorna sem mudanças no histórico
      return {
        ...person,
        balance: 0
      };
    }));

    // Zerar todo o estoque dos produtos
    setProducts(prev => prev.map(product => ({
      ...product,
      stock: 0
    })));

    // Aguardar um momento para garantir que as alterações sejam persistidas
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const updateBranding = (updates: Partial<BrandingConfig>) => {
    setBranding(prev => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider value={{
      people,
      products,
      branding,
      addPerson,
      updatePerson,
      deletePerson,
      addProduct,
      updateProduct,
      deleteProduct,
      addPurchase,
      deletePurchase,
      deletePurchaseItem,
      updatePurchaseItemQuantity,
      getPersonById,
      getProductById,
      getProductByBarcode,
      importProductsFromCSV,
      importPeopleFromCSV,
      encerrarAcampamento,
      updateBranding
    }}>
      {children}
    </AppContext.Provider>
  );
};