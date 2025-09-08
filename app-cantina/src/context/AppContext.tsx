import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Person, Product, Purchase, PurchaseItem } from '../types/index';

interface AppContextType {
  people: Person[];
  products: Product[];
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

  useEffect(() => {
    localStorage.setItem('cantina_people', JSON.stringify(people));
  }, [people]);

  useEffect(() => {
    localStorage.setItem('cantina_products', JSON.stringify(products));
  }, [products]);

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

  return (
    <AppContext.Provider value={{
      people,
      products,
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
      getProductByBarcode
    }}>
      {children}
    </AppContext.Provider>
  );
};