export interface EstoqueItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  cartCount: number;
  interestCount: number;
}

export const estoqueItems: EstoqueItem[] = [
  {
    id: '1',
    name: 'Abraçadeira de nylon 40 cm',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 5,
    interestCount: 12,
  },
  {
    id: '2',
    name: 'Abraçadeira de nylon preta',
    image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 3,
    interestCount: 8,
  },
  {
    id: '3',
    name: 'Arame Plastificado (10 cm)',
    image: 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 7,
    interestCount: 15,
  },
  {
    id: '4',
    name: 'Arruela 6 mm',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 2,
    interestCount: 4,
  },
  {
    id: '5',
    name: 'Arruela 8 mm',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 1,
    interestCount: 6,
  },
  {
    id: '6',
    name: 'Barbante (10 cm)',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 4,
    interestCount: 9,
  },
  {
    id: '7',
    name: 'Barra roscada 6 mm (10 cm)',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 0,
    interestCount: 3,
  },
  {
    id: '8',
    name: 'Barra roscada 8 mm (10 cm)',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 2,
    interestCount: 5,
  },
  {
    id: '9',
    name: 'Bexiga',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 10,
    interestCount: 22,
  },
  {
    id: '10',
    name: 'Bolinha de Gude',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=300&h=300&fit=crop',
    quantity: 0,
    cartCount: 8,
    interestCount: 18,
  },
];
