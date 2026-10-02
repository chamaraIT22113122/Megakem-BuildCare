import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import logo from './assets/Megakem  Brand Logo-01.png';
import blueLogo from './assets/Blue transparent.png';
import footerImg from './assets/footer.png';
import heroBg from './assets/hero-bg.jpg';
import l1 from './assets/logos/1.png';
import l2 from './assets/logos/2.jpeg';
import l3 from './assets/logos/3.png';
import l4 from './assets/logos/4.png';
import l5 from './assets/logos/5.png';
import l6 from './assets/logos/6.png';
import l7 from './assets/logos/7.png';
import l8 from './assets/logos/8.png';
import l9 from './assets/logos/9.png';
import l10 from './assets/logos/10.png';
import l11 from './assets/logos/11.jpeg';
import l12 from './assets/logos/12.png';
import l13 from './assets/logos/13.png';

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Badge,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  Fab
} from '@mui/material';
import {
  ShoppingCart,
  AddShoppingCart,
  Info,
  SupportAgent,
  CheckCircle,
  ContentCopy,
  ExpandMore,
  Description,
  Search,
  Close,
  Visibility,
  KeyboardArrowUp
} from '@mui/icons-material';

interface Product {
  _id: string;
  name: string;
  productNo: string;
  category: string;
  packSizePricing: { packSize: string, price: number }[];
  price: number; // Base price if packSizePricing is empty
  imageUrl: string;
  tdsUrl: string;
  description: string;
}

export interface ProductVariant {
  id: string; // unique string identifier
  originalProduct: Product;
  color: string; // e.g. "White", "Yellow", "Default"
  size: string; // e.g. "20Kg", "1 Ltr"
  price: number;
}

export interface GroupedProduct {
  id: string; // The base name, e.g. "MEGATITANIUM"
  name: string; 
  category: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
}

interface CartItem extends Product {
  id: string; // generated unique id
  selectedPackSize: string;
  selectedColor?: string;
  quantity: number;
  mrp: number;
}

interface CheckoutDetails {
  employeeName: string;
  employeeId: string;
  company: string;
  department: string;
  designation: string;
  contactNumber: string;
  emailAddress: string;
  managerName: string;
  managerEmail: string;
  hrName: string;
  hrEmail: string;
  preference: string;
  notes: string;
}

const initialCheckoutDetails: CheckoutDetails = {
  employeeName: '',
  employeeId: '',
  company: '',
  department: '',
  designation: '',
  contactNumber: '',
  emailAddress: '',
  managerName: '',
  managerEmail: '',
  hrName: '',
  hrEmail: '',
  preference: 'Collection',
  notes: ''
};

const footerLogos = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13];

function App() {
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('megakem_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>(initialCheckoutDetails);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [addProduct, setAddProduct] = useState<GroupedProduct | null>(null);
  
  // Quick Add Configuration Dialog State
  const [configQuantity, setConfigQuantity] = useState(1);
  const [configPackSize, setConfigPackSize] = useState("");
  const [configColor, setConfigColor] = useState("");
  const [activeImage, setActiveImage] = useState("");
  
  const getColorCode = (colorName: string) => {
    const name = colorName.toLowerCase();
    if (name.includes('white')) return '#FFFFFF';
    if (name.includes('light grey')) return '#D3D3D3';
    if (name.includes('grey')) return '#808080';
    if (name.includes('black')) return '#000000';
    if (name.includes('yellow')) return '#FFD700';
    if (name.includes('clear')) return 'transparent';
    if (name.includes('red')) return '#FF0000';
    if (name.includes('blue')) return '#0000FF';
    if (name.includes('green')) return '#008000';
    if (name.includes('orange')) return '#FFA500';
    return '#e0e0e0';
  };

  useEffect(() => {
    localStorage.setItem('megakem_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const processData = (data: Product[]) => {
      const sizeRegex = /\b(\d+(?:\.\d+)?\s*(?:Kg|kg|KG|g|G|Ltr|ltr|L|l|ML|ml)(?:\s*(?:Set|CAN|Can|can))?)\b/i;
      const knownColors = ['White', 'Light Grey', 'Grey', 'Black', 'Yellow', 'Clear', 'Red', 'Blue', 'Green', 'Orange'];

      const groups: Record<string, GroupedProduct> = {};
      
      data.forEach(product => {
        let size = '';
        const sm = product.name.match(sizeRegex);
        if (sm) size = sm[1];
        
        let color = 'Default';
        for (const c of knownColors) {
          if (new RegExp('\\b' + c + '\\b', 'i').test(product.name)) {
            color = c;
            break;
          }
        }
        
        let base = product.name;
        if (size) base = base.replace(sm[0], '');
        if (color !== 'Default') base = base.replace(new RegExp('\\b' + color + '\\b', 'i'), '');
        
        base = base.replace(/[\-\s]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

        if (!groups[base]) {
          groups[base] = {
            id: base,
            name: base,
            category: product.category,
            description: product.description,
            images: product.imageUrl ? [product.imageUrl] : [],
            variants: []
          };
        } else {
          if (product.imageUrl && !groups[base].images.includes(product.imageUrl)) {
            groups[base].images.push(product.imageUrl);
          }
        }
        
        if (product.packSizePricing && product.packSizePricing.length > 0) {
          product.packSizePricing.forEach(psp => {
            groups[base].variants.push({
              id: `${product._id}-${psp.packSize}`,
              originalProduct: product,
              color: color,
              size: psp.packSize,
              price: psp.price
            });
          });
        } else {
          groups[base].variants.push({
            id: product._id,
            originalProduct: product,
            color: color,
            size: size || 'Standard',
            price: product.price || 0
          });
        }
      });

      setProducts(Object.values(groups));
      setLoading(false);
    };

    const apiUrl = import.meta.env.VITE_API_URL;
    const localUrl = `${import.meta.env.BASE_URL}products.json`;

    // 1. Immediately load local static JSON for instant UI
    fetch(localUrl)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          processData(data);
        }
      })
      .catch(console.error);

    // 2. Silently fetch from real API to get fresh data in the background
    const fetchUrl = apiUrl ? `${apiUrl}/api/products` : import.meta.env.DEV ? "http://localhost:5001/api/products" : localUrl;
    
    if (fetchUrl !== localUrl) {
      fetch(fetchUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            processData(data);
          }
        })
        .catch(err => {
          console.error('Background API fetch failed:', err);
          // If local data also failed and loading is still true, we show error
          setTimeout(() => {
            setLoading(prev => {
              if (prev) setSnackbar({ open: true, message: 'Failed to load live products', severity: 'error' });
              return false;
            });
          }, 1000);
        });
    } else {
       // If there's no API URL and we are not in dev, local data is all we have
       setTimeout(() => setLoading(false), 500); 
    }
  }, []);

  const productCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => p.category && cats.add(p.category));
    return Array.from(cats).sort();
  }, [products]);

  const handleOpenProductDetails = (product: GroupedProduct) => {
    setSelectedProduct(product);
  };

  const handleOpenAddToCart = (product: GroupedProduct) => {
    setAddProduct(product);
    setConfigQuantity(1);
    
    // Auto-select first available color and size
    const firstColor = product.variants.length > 0 ? product.variants[0].color : "Default";
    setConfigColor(firstColor);
    
    const sizesForColor = product.variants.filter(v => v.color === firstColor);
    if (sizesForColor.length > 0) {
      setConfigPackSize(sizesForColor[0].size);
      const img = sizesForColor[0].originalProduct.imageUrl;
      if (img) setActiveImage(img);
    } else {
      setConfigPackSize("");
      setActiveImage(product.images[0] || "");
    }
  };

  const addToCart = (product: GroupedProduct, quantity: number, packSize: string, color: string) => {
    if (quantity <= 0) return;
    
    const variant = product.variants.find(v => v.color === color && v.size === packSize);
    if (!variant) return;
    
    const originalProd = variant.originalProduct;
    const mrp = variant.price;
    const cartItemId = `${originalProd._id}-${packSize}-${color}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) => item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...originalProd, id: cartItemId, selectedPackSize: packSize, selectedColor: color === "Default" ? undefined : color, quantity, mrp }];
    });
    
    setAddProduct(null);
    toast.success(`${originalProd.name} added to cart`, {
      description: `${quantity} × ${packSize} ${color !== 'Default' ? `(${color})` : ''}`,
      position: 'bottom-center'
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCart((prev) => prev.map((item) => item.id === productId ? { ...item, quantity } : item));
    }
  };

  const getDiscountedPrice = (item: CartItem) => {
    // 47% discount if quantity >= 10 for the same product line. Otherwise 45%.
    const discountPercent = item.quantity >= 10 ? 0.47 : 0.45;
    return item.mrp * (1 - discountPercent);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (getDiscountedPrice(item) * item.quantity), 0);
  }, [cart]);
  
  const cartMRP = useMemo(() => {
    return cart.reduce((total, item) => total + (item.mrp * item.quantity), 0);
  }, [cart]);

  const cartSavings = cartMRP - cartTotal;

  const handleCheckoutChange = (field: keyof CheckoutDetails, value: string) => {
    setCheckoutDetails((prev) => ({ ...prev, [field]: value }));
  };

  const generateEmailBody = () => {
    let productsTable = `Product Name | Pack Size | Quantity | MRP per Pack | Applicable Discount | Discounted Unit Price | Line Total\n`;
    productsTable += `--------------------------------------------------------------------------------------------------------\n`;
    
    cart.forEach(item => {
      const discountPercent = item.quantity >= 10 ? '47%' : '45%';
      const discountedPrice = getDiscountedPrice(item);
      const lineTotal = discountedPrice * item.quantity;
      const packAndColor = item.selectedColor ? `${item.selectedPackSize} (${item.selectedColor})` : item.selectedPackSize;
      productsTable += `${item.name} | ${packAndColor} | ${item.quantity} | Rs. ${item.mrp.toFixed(2)} | ${discountPercent} | Rs. ${discountedPrice.toFixed(2)} | Rs. ${lineTotal.toFixed(2)}\n`;
    });

    return `Dear ${checkoutDetails.managerName || '[Manager Name]'},

I would like to request approval to proceed with the following order under the Megakem BuildCare employee benefit program.

Employee Details

Employee Name: ${checkoutDetails.employeeName}
Employee ID: ${checkoutDetails.employeeId}
Company: ${checkoutDetails.company}
Department: ${checkoutDetails.department}
Designation: ${checkoutDetails.designation}
Contact Number: ${checkoutDetails.contactNumber}
Email Address: ${checkoutDetails.emailAddress}

Order Details

${productsTable}

Total MRP Value: Rs. ${cartMRP.toFixed(2)}
Total Discounted Value: Rs. ${cartSavings.toFixed(2)}
Total Savings: Rs. ${cartSavings.toFixed(2)}
Final Payable Value: Rs. ${cartTotal.toFixed(2)}

Discount Note:
The standard Megakem BuildCare employee discount is 45% from MRP. A 47% discount has been applied only to product lines where the quantity is 10 packs or more from the same product line.

Approval Request:
Kindly approve this order so that I can forward the approved email thread to Megakem Lanka Finance for order processing.

Thank you.

Best regards,
${checkoutDetails.employeeName || '[Employee Name]'}`;
  };
  const handleSubmitOrder = async () => {
    if (!checkoutDetails.employeeName || !checkoutDetails.managerName) {
      toast.error('Please fill in required fields');
      return;
    }

    const orderData = {
      ...checkoutDetails,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        packSize: item.selectedPackSize,
        color: item.selectedColor,
        unitPrice: getDiscountedPrice(item),
        totalPrice: getDiscountedPrice(item) * item.quantity
      })),
      totalAmount: cartTotal
    };

    // 1. Immediately generate email and open Outlook
    const mailtoLink = `mailto:?cc=udaryahampath@wardena.com&subject=${encodeURIComponent(`Employee Order Approval Request - ${checkoutDetails.employeeName || 'Employee'}`)}&body=${encodeURIComponent(generateEmailBody())}`;
    window.location.href = mailtoLink;

    // 2. Instantly clear form and close cart for snappy UI
    setCart([]);
    setCheckoutDetails({
      employeeName: '',
      employeeId: '',
      company: '',
      department: '',
      designation: '',
      contactNumber: '',
      emailAddress: '',
      managerName: ''
    });
    setIsCartOpen(false);
    toast.success('Order email drafted! Saving to database in background...');

    // 3. Fire-and-forget background API request (does not block user)
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).catch(err => console.error('Background order save failed:', err));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generateEmailBody());
    setSnackbar({ open: true, message: 'Email body copied to clipboard!', severity: 'info' });
  };
  
  const handleCopyForwardingEmails = () => {
    navigator.clipboard.writeText("To: accounts2.lanka@megakemglobal.com\nCC: qc.npd@megakemglobal.com, accounts@megakemglobal.com");
    setSnackbar({ open: true, message: 'Forwarding emails copied!', severity: 'info' });
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Box sx={{ flexGrow: 1, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'primary.main', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', pt: 1, pb: 1 }}>
            <Box component="img" src={logo} alt="Megakem Logo" sx={{ height: 40, width: 'auto', mr: 2, objectFit: 'contain' }} />
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ color: 'white !important', textTransform: 'uppercase', fontWeight: 'bold', lineHeight: 1.2, letterSpacing: 0.5 }}>
                Megakem BuildCare
              </Typography>
              <Typography variant="caption" sx={{ letterSpacing: 1, color: 'rgba(255,255,255,0.9)', fontSize: '0.65rem' }}>
                WARDENA GROUP EMPLOYEE PLATFORM
              </Typography>
            </Box>
          </Box>
          <Button color="inherit" onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>Products</Button>
          <IconButton color="inherit" onClick={() => setIsCartOpen(true)}>
            <Badge badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ 
        background: `linear-gradient(135deg, rgba(0, 51, 102, 0.85) 0%, rgba(0, 26, 51, 0.95) 100%), url(${heroBg})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white', 
        py: { xs: 8, md: 12 }, 
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract shapes for eye-catching design */}
        <Box sx={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(164,210,51,0.15) 0%, rgba(0,0,0,0) 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, right: -50, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,144,164,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
        
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Badge badgeContent="EXCLUSIVE" color="secondary" sx={{ mb: 4, '& .MuiBadge-badge': { fontSize: '0.8rem', padding: '12px 8px', fontWeight: 'bold' } }}>
            <Typography variant="h2" component="h1" fontWeight="bold" sx={{ color: 'white !important', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              Megakem BuildCare
            </Typography>
          </Badge>
          <Typography variant="h5" gutterBottom sx={{ mb: 4, color: 'primary.lighter', fontWeight: '300' }}>
            Exclusive construction chemical benefits for Wardena Group employees
          </Typography>
          <Typography variant="body1" sx={{ mb: 5, fontSize: '1.1rem', opacity: 0.9, maxWidth: '800px', mx: 'auto', lineHeight: 1.8 }}>
            As part of the Wardena Group family, employees can now access selected Megakem-manufactured products at special discounted prices, supported by free technical guidance from the Megakem team.
          </Typography>

          {/* Logo Marquee */}
          <Box 
            sx={{ 
              width: '100%', 
              overflow: 'hidden', 
              mb: 5, 
              position: 'relative',
              maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                width: 'fit-content',
                py: 2, // Add padding so hover scaling doesn't clip on the parent bounds
                '&:hover > div': { animationPlayState: 'paused' } 
              }}
            >
              {[1, 2].map((group) => (
                <Box 
                  key={group} 
                  sx={{ 
                    display: 'flex', 
                    animation: 'marquee 30s linear infinite', 
                    '@keyframes marquee': { 
                      '0%': { transform: 'translateX(0)' }, 
                      '100%': { transform: 'translateX(-100%)' } 
                    } 
                  }}
                >
                  {footerLogos.map((logo, idx) => (
                    <Box 
                      key={`${group}-${idx}`} 
                      sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 2, 
                        p: 1.5, 
                        mx: 1.5, 
                        width: { xs: 80, md: 110 }, 
                        height: { xs: 50, md: 65 }, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexShrink: 0,
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        position: 'relative',
                        '&:hover': {
                          transform: 'translateY(-4px) scale(1.08)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          zIndex: 10
                        }
                      }}
                    >
                      <Box component="img" src={logo} sx={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
            <Button variant="contained" color="secondary" size="large" sx={{ px: 4, py: 1.5, borderRadius: 50, fontWeight: 'bold', boxShadow: '0 8px 16px rgba(164,210,51,0.3)', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-3px)' } }} onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
              View Products
            </Button>
            <Button variant="outlined" size="large" sx={{ px: 4, py: 1.5, borderRadius: 50, fontWeight: 'bold', color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How Approval Works
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Benefit Cards Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 0 }, position: 'relative', mt: { md: -6 }, zIndex: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          <Card sx={{ height: '100%', borderRadius: 3, borderTop: 6, borderColor: 'secondary.main', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">45% Discount</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>Standard discount on all eligible Megakem-manufactured products from listed MRP.</Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%', borderRadius: 3, borderTop: 6, borderColor: 'secondary.main', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">47% Bulk Discount</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>Order 10+ packs of the exact same product and size to unlock bulk pricing automatically.</Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%', borderRadius: 3, borderTop: 6, borderColor: 'secondary.main', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">Instant Approval</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>Generate your complete HR approval email in one click right at checkout.</Typography>
            </CardContent>
          </Card>
          <Card sx={{ height: '100%', borderRadius: 3, borderTop: 6, borderColor: 'secondary.main', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: '0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">Free Consultation</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>Direct access to Megakem technical experts for waterproofing and construction guidance.</Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* How The Order Process Works */}
      <Container id="how-it-works" maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" gutterBottom color="primary.main" fontWeight="bold" align="center" sx={{ mb: 6 }}>
          How To Place An Order
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 6, maxWidth: 800, mx: 'auto', color: 'text.secondary' }}>
          All Megakem BuildCare orders must first be approved through the employee's internal reporting and HR approval process. The website will help employees prepare the correct email with their selected products and calculated discounts.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {[
            { step: 'Step 1: Select Products', desc: 'Browse the product list, select the required product, pack size, colour or variant, and add the required quantity to the cart.' },
            { step: 'Step 2: Review Cart and Discounts', desc: 'The cart will automatically calculate the applicable employee discount. 45% standard, or 47% if ordering 10+ packs of the same product.' },
            { step: 'Step 3: Generate Approval Email', desc: 'At checkout, the website should generate a complete email body containing the employee details, selected products, and final values.' },
            { step: 'Step 4: Send Approval Email Internally', desc: 'Copy the generated email and send it to your respective Line Manager or Department Head, copying the relevant HR Department.' },
            { step: 'Step 5: Forward Approved Thread to Megakem', desc: 'After receiving approval, forward the approved email thread to accounts2.lanka@megakemglobal.com copying qc.npd and accounts.' },
            { step: 'Step 6: Order Confirmation', desc: 'Megakem Lanka Finance and the team will review the approved order, confirm stock availability and communicate final payment instructions.' }
          ].map((s, i) => (
            <Paper key={i} sx={{ p: 3, height: '100%', position: 'relative', borderRadius: 3, border: '1px solid #eee', overflow: 'hidden' }}>
              <Box sx={{ position: 'absolute', top: -10, right: -10, fontSize: '6rem', fontWeight: 'bold', color: 'rgba(0,51,102,0.03)', lineHeight: 1 }}>
                {i + 1}
              </Box>
              <Typography variant="h6" color="primary.main" fontWeight="bold" sx={{ mb: 2, position: 'relative' }}>
                {s.step}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', lineHeight: 1.6 }}>
                {s.desc}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      <Divider />

      {/* Product Catalogue */}
      <Container id="products" maxWidth="xl" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom color="primary.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          Megakem Product Info & Catalog
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Explore all official company products, technical specifications & exclusive employee discounts
        </Typography>
        
        <Box sx={{ mb: 5 }}>
          <Autocomplete
            freeSolo
            options={products.map(p => p.name)}
            value={searchQuery}
            onInputChange={(event, newInputValue) => {
              setSearchQuery(newInputValue);
            }}
            renderInput={(params) => (
              <TextField 
                {...params}
                placeholder="Search product by name, code, or category..." 
                variant="outlined" 
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <IconButton edge="start" disabled sx={{ ml: 1 }}>
                        <Search />
                      </IconButton>
                      {params.InputProps?.startAdornment}
                    </>
                  ),
                  sx: { borderRadius: '50px', bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }
                }}
              />
            )}
          />
        </Box>


        <Box 
          component={motion.div}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', gridColumn: '1 / -1', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredProducts.map(groupedProduct => {
            const minPrice = Math.min(...groupedProduct.variants.map(v => v.price));
            const price45 = minPrice * 0.55;
            const price47 = minPrice * 0.53;
            
            return (
              <Box 
                component={motion.div}
                key={groupedProduct.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
                }}
                whileHover={{ y: -5 }}
              >
              <Card sx={{ 
                width: '100%',
                height: '100%',
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: 4, 
                border: '1px solid #e0e0e0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                overflow: 'visible',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
              }}>
                <Box sx={{ p: 2, pb: 0, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {groupedProduct.images.length > 0 ? (
                      <img src={groupedProduct.images[0]} alt={groupedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                   ) : (
                      <Box sx={{ width: '100%', height: '100%', bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No Image</Typography>
                      </Box>
                   )}
                </Box>
                <CardContent sx={{ flexGrow: 1, px: 3, pt: 1.5, pb: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ height: 28, mb: 1 }}>
                      {/* Products might have different codes per variant, omit here for brevity or show one */}
                    </Box>

                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      title={groupedProduct.name}
                      sx={{ 
                        mb: 0.5, 
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.4em'
                      }}
                    >
                      {groupedProduct.name}
                    </Typography>
                    
                    {(() => {
                      const uniqueColors = Array.from(new Set(groupedProduct.variants.map(v => v.color).filter(c => c !== 'Default')));
                      const uniqueSizes = Array.from(new Set(groupedProduct.variants.map(v => v.size).filter(s => s !== 'Standard' && s !== '')));
                      
                      return (
                        <Box sx={{ minHeight: 45, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0.75, textAlign: 'center' }}>
                          {uniqueColors.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              {uniqueColors.map(c => (
                                <Box 
                                  key={c}
                                  title={c}
                                  sx={{ 
                                    width: 16, 
                                    height: 16, 
                                    borderRadius: '50%', 
                                    bgcolor: getColorCode(c),
                                    border: '1px solid',
                                    borderColor: c.toLowerCase().includes('white') ? 'grey.300' : 'rgba(0,0,0,0.1)',
                                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                                  }} 
                                />
                              ))}
                            </Box>
                          )}
                          {uniqueSizes.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500', display: 'block' }}>
                              {uniqueSizes.join(', ')}
                            </Typography>
                          )}
                          {uniqueColors.length === 0 && uniqueSizes.length === 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500', display: 'block' }}>
                              Standard Pack
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}

                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Starting at</Typography>
                        <Typography variant="h6" fontWeight="bold" color="secondary.dark">
                          Rs. {price45.toFixed(2)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: '600', mb: 1 }}>
                        Bulk (10+): Rs. {price47.toFixed(2)}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <Divider sx={{ mx: 3 }} />
                  
                  <Box sx={{ p: 2, px: 3, display: 'flex', gap: 1.5 }}>
                     <Button 
                        variant="outlined" 
                        color="primary" 
                        fullWidth 
                        onClick={() => handleOpenProductDetails(groupedProduct)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                      >
                        Details
                      </Button>
                     <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        onClick={() => handleOpenAddToCart(groupedProduct)}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        Add
                      </Button>
                  </Box>
              </Card>
              </Box>
            );
          })}
        </Box>
      </Container>

      {/* Cart & Checkout Dialog */}
      <Dialog 
        open={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
          <Typography variant="h5" color="primary.main" fontWeight="bold">
            Your Order Summary
          </Typography>
          <IconButton onClick={() => setIsCartOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: '#f8f9fa' }}>
        
        {cart.length === 0 ? (
          <Typography variant="body1" sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            Your cart is currently empty. Please add products to proceed.
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 4 }}>
            <Box>
              <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                <AnimatePresence>
                {cart.map((item, index) => {
                  const discountPercent = item.quantity >= 10 ? 47 : 45;
                  const discountedPrice = getDiscountedPrice(item);
                  const isBulk = item.quantity >= 10;
                  
                  return (
                    <Box 
                      component={motion.div}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={item.id} 
                      sx={{ p: 2, borderBottom: index < cart.length - 1 ? '1px solid #eee' : 'none' }}
                    >
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography fontWeight="bold">{item.name}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            {item.selectedPackSize && (
                              <Typography variant="body2" color="text.secondary">
                                {item.selectedPackSize}
                              </Typography>
                            )}
                            {item.selectedPackSize && item.selectedColor && (
                              <Typography variant="body2" color="text.secondary">|</Typography>
                            )}
                            {item.selectedColor && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: getColorCode(item.selectedColor), border: '1px solid rgba(0,0,0,0.1)' }} />
                                <Typography variant="body2" color="text.secondary">{item.selectedColor}</Typography>
                              </Box>
                            )}
                          </Box>
                          {isBulk && (
                            <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 'bold', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <CheckCircle fontSize="inherit" sx={{ mr: 0.5 }}/> Qualifies for 47% BuildCare discount
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button size="small" variant="outlined" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</Button>
                            <Typography sx={{ mx: 2 }}>{item.quantity}</Typography>
                            <Button size="small" variant="outlined" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3} sx={{ textAlign: 'right' }}>
                          <Typography fontWeight="bold">Rs. {(discountedPrice * item.quantity).toFixed(2)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            (Rs. {discountedPrice.toFixed(2)} ea)
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )
                })}
                </AnimatePresence>
              </Paper>
              
              <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Total MRP</Typography>
                  <Typography>Rs. {cartMRP.toFixed(2)}</Typography>
                </Grid>
                <Grid container justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography color="secondary.dark" fontWeight="bold">Total Savings</Typography>
                  <Typography color="secondary.dark" fontWeight="bold">- Rs. {cartSavings.toFixed(2)}</Typography>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Grid container justifyContent="space-between">
                  <Typography variant="h6" fontWeight="bold">Final Cart Total</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">Rs. {cartTotal.toFixed(2)}</Typography>
                </Grid>
              </Box>
            </Box>
            
            <Box>
              <Card elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                  Generate Your Approval Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Fill in your details below to generate the approval email for your Line Manager/Department Head.
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField fullWidth size="small" label="Employee Name" required 
                    value={checkoutDetails.employeeName} onChange={(e) => handleCheckoutChange('employeeName', e.target.value)} />
                  <TextField fullWidth size="small" label="Employee ID" 
                    value={checkoutDetails.employeeId} onChange={(e) => handleCheckoutChange('employeeId', e.target.value)} />
                  <TextField fullWidth size="small" label="Company" required 
                    value={checkoutDetails.company} onChange={(e) => handleCheckoutChange('company', e.target.value)} />
                  <TextField fullWidth size="small" label="Department" required 
                    value={checkoutDetails.department} onChange={(e) => handleCheckoutChange('department', e.target.value)} />
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <TextField fullWidth size="small" label="Manager / Dept Head Name" required 
                      value={checkoutDetails.managerName} onChange={(e) => handleCheckoutChange('managerName', e.target.value)} />
                  </Box>
                  <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      fullWidth 
                      size="large"
                      onClick={handleSubmitOrder}
                      disabled={!checkoutDetails.employeeName || !checkoutDetails.managerName}
                      sx={{ mt: 2, fontWeight: 'bold' }}
                    >
                      SUBMIT ORDER FOR APPROVAL
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        )}
        </DialogContent>
      </Dialog>
      
      {/* Generated Email Backup Modal (Optional, if Outlook fails) */}
      <Dialog open={showEmail} onClose={() => setShowEmail(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" color="primary.main" fontWeight="bold">Manual Email Copy (If Outlook Failed)</Typography>
          <IconButton onClick={() => setShowEmail(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 3 }}>
            If Outlook didn't open automatically, copy the email body below and send it to your Line Manager or Department Head.
          </Typography>
          
          <Box sx={{ position: 'relative', p: 3, bgcolor: '#f1f5f9', borderRadius: 2, fontFamily: 'monospace', whiteSpace: 'pre-wrap', mb: 3, fontSize: '0.85rem' }}>
            {generateEmailBody()}
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<ContentCopy />} 
              sx={{ position: 'absolute', top: 16, right: 16 }}
              onClick={handleCopyEmail}
            >
              Copy Email Body
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Divider />

      {/* Free Technical Assistance */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" color="primary.main" fontWeight="bold" gutterBottom>
              Need Help Choosing The Right Product?
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', lineHeight: 1.6 }}>
              Megakem provides free technical assistance for employees who require guidance on waterproofing and related construction requirements.
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6 }}>
              Whether the issue is a leaking roof slab, bathroom waterproofing, water tank protection, wall cracks, roof fastener leakage, roof sheet joints, dampness or general repair work, the Megakem team can guide employees on the suitable product and application method.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              href="mailto:qc.npd@megakemglobal.com?cc=technical@megakemglobal.com&subject=Megakem%20BuildCare%20Technical%20Assistance%20Request"
              sx={{ borderRadius: 50, px: 3, py: 1, fontWeight: 'bold' }}
            >
              Request Technical Guidance
            </Button>
          </Box>
          <Box sx={{ flex: { xs: 'none', md: '0 0 400px' } }}>
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
                Technical Assistance Contacts
              </Typography>
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">Chamika Kurunayaka</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #eee', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">qc.npd@megakemglobal.com</Typography>
                  <Button size="small" sx={{ minWidth: 'auto', p: 0.5 }} onClick={() => { navigator.clipboard.writeText('qc.npd@megakemglobal.com'); setSnackbar({ open: true, message: 'Email copied!', severity: 'info' }); }}>Copy</Button>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold">Udara Yahampath</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #eee', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">technical@megakemglobal.com</Typography>
                  <Button size="small" sx={{ minWidth: 'auto', p: 0.5 }} onClick={() => { navigator.clipboard.writeText('technical@megakemglobal.com'); setSnackbar({ open: true, message: 'Email copied!', severity: 'info' }); }}>Copy</Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: '#f1f5f9', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 6 }}>
            {/* Terms and Conditions */}
            <Box>
              <Typography variant="h5" color="primary.main" fontWeight="bold" gutterBottom>
                Important Notes
              </Typography>
              <Box sx={{ mt: 3, '& > p': { mb: 2, color: 'text.secondary', fontSize: '0.9rem' } }}>
                <Typography>• This offer is available only for eligible Wardena Group employees.</Typography>
                <Typography>• The 45% employee discount applies only to selected Megakem-manufactured products listed on this page.</Typography>
                <Typography>• The 47% discount applies only when the employee orders 10 packs or more from the same product line.</Typography>
                <Typography>• Different products cannot be combined to qualify for the 47% discount.</Typography>
                <Typography>• All orders must be approved by the employee's Line Manager or Department Head, with HR copied in the approval email.</Typography>
                <Typography>• Approved email threads must be forwarded to accounts2.lanka@megakemglobal.com, copying qc.npd@megakemglobal.com and accounts@megakemglobal.com.</Typography>
                <Typography>• All orders are subject to stock availability and internal order confirmation.</Typography>
                <Typography>• Prices may be revised without prior notice based on product availability, pack-size updates or approved price-list revisions.</Typography>
                <Typography>• Technical assistance is provided as guidance. Final application quality depends on correct surface preparation, product selection and proper application method.</Typography>
              </Box>
            </Box>

            {/* FAQ Section */}
            <Box>
              <Typography variant="h5" color="primary.main" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Frequently Asked Questions
              </Typography>
              
              {[
                { q: 'Who can use this offer?', a: 'This offer is available for employees of Wardena Group companies.' },
                { q: 'What is the employee discount?', a: 'Eligible employees receive a 45% discount from the listed MRP on selected Megakem-manufactured products.' },
                { q: 'How do I qualify for the 47% discount?', a: 'You must order 10 packs or more from the same product line. Mixed products cannot be combined to qualify for the 47% discount.' },
                { q: 'Do I need approval for every order?', a: 'Yes. Every order must first be sent to your Line Manager or Department Head, copying the relevant HR Department. After approval, the approved email thread must be forwarded to Megakem Lanka Finance.' },
                { q: 'Can I place an order directly through the website?', a: 'No. The website helps you select products, calculate discounts and generate the approval email. The actual order is processed only after the approved email thread is forwarded to Megakem Lanka Finance.' }
              ].map((faq, i) => (
                <Accordion key={i} sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '8px !important' }}>
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ fontWeight: 'bold' }}>
                    {faq.q}
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Locations / Maps Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" color="primary.main" fontWeight="bold" align="center" gutterBottom>
          Our Locations
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Visit us at our corporate office or manufacturing facility.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'center', gap: 4, mx: 'auto', maxWidth: 1000 }}>
          <Box sx={{ flex: 1, maxWidth: 450, width: '100%' }}>
            <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 4, overflow: 'hidden', height: '100%' }}>
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">Megakem Engineering (Pvt) Ltd.</Typography>
                <Typography variant="body2" color="text.secondary">Corporate Office</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 250 }}>
                <iframe 
                  src="https://maps.google.com/maps?q=6.9073013,79.8955895&hl=en&z=15&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </Box>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1, maxWidth: 450, width: '100%' }}>
            <Card elevation={0} sx={{ border: '1px solid #eee', borderRadius: 4, overflow: 'hidden', height: '100%' }}>
              <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">Megakem Lanka (Pvt) Ltd.</Typography>
                <Typography variant="body2" color="text.secondary">Manufacturing Facility</Typography>
              </Box>
              <Box sx={{ width: '100%', height: 250 }}>
                <iframe 
                  src="https://maps.google.com/maps?q=6.8671507,80.0362158&hl=en&z=15&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </Box>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Footer CTA */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #001a33 0%, #000d1a 100%)', 
        color: 'white', 
        py: { xs: 5, md: 6 },
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: '50%', height: '100%', background: 'radial-gradient(circle, rgba(164,210,51,0.08) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
            
            <Box sx={{ flex: 1, minWidth: { sm: '50%' } }}>
              <Box component="img" src={logo} alt="Megakem Logo" sx={{ height: 32, mb: 1.5, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'white !important', letterSpacing: -0.5, mb: 1.5 }}>
                Build Better With <Box component="span" sx={{ color: 'secondary.main' }}>Megakem</Box>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 450 }}>
                Select your products, generate your approval email and access Megakem-manufactured construction chemical solutions at exclusive employee prices.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="contained" color="secondary" size="medium" sx={{ borderRadius: 50, px: 3, fontWeight: 'bold', color: 'primary.dark', boxShadow: '0 4px 8px rgba(164,210,51,0.2)' }} onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}>
                  Start My Order
                </Button>
                <Button variant="outlined" size="medium" sx={{ borderRadius: 50, px: 3, fontWeight: 'bold', color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  Learn More
                </Button>
              </Box>
            </Box>
            
            <Box sx={{ flex: 1, minWidth: { sm: '45%' }, width: '100%' }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.03)', p: 2.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'white !important', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SupportAgent color="secondary" fontSize="small" /> Technical Assistance
                </Typography>
                <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                  Need help choosing the right product? Our engineering team provides free technical assistance for waterproofing, cracks, dampness, and general repair work.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: 'white', flex: 1, borderColor: 'rgba(255,255,255,0.15)', px: 1.5, borderRadius: 2, '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(164,210,51,0.05)', color: 'secondary.main' } }}
                    onClick={() => {
                      window.location.href = "mailto:qc.npd@megakemglobal.com?cc=technical@megakemglobal.com&subject=Technical%20Assistance%20Request%20-%20Megakem%20BuildCare";
                    }}
                  >
                    Email Chamika
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    sx={{ color: 'white', flex: 1, borderColor: 'rgba(255,255,255,0.15)', px: 1.5, borderRadius: 2, '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(164,210,51,0.05)', color: 'secondary.main' } }}
                    onClick={() => {
                      window.location.href = "mailto:technical@megakemglobal.com?cc=qc.npd@megakemglobal.com&subject=Technical%20Assistance%20Request%20-%20Megakem%20BuildCare";
                    }}
                  >
                    Email Udara
                  </Button>
                </Box>
              </Box>
            </Box>

          </Box>
        </Container>
          


        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ mt: 5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
              © {new Date().getFullYear()} Megakem Engineering (Pvt) Ltd. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
              Exclusive platform for Wardena Group Employees
            </Typography>
          </Box>
        </Container>
      </Box>
      


      {/* ── DETAILS DIALOG (info + description only) ── */}
      <Dialog 
        open={Boolean(selectedProduct)} 
        onClose={() => setSelectedProduct(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {selectedProduct && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                {selectedProduct.name}
              </Typography>
              <IconButton onClick={() => setSelectedProduct(null)} sx={{ color: 'text.secondary' }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0 }}>
              <Grid container>
                <Grid item xs={12} md={5} sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'white' }}>
                  <Box 
                    component="img" 
                    src={selectedProduct.images[0] || '/placeholder.jpg'} 
                    sx={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 2, mb: 2 }} 
                  />
                  {selectedProduct.images.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, maxWidth: '100%' }}>
                      {selectedProduct.images.map((img, i) => (
                         <Box 
                            key={i} 
                            component="img" 
                            src={img} 
                            sx={{ width: 60, height: 60, borderRadius: 1, border: '1px solid', borderColor: 'grey.300', objectFit: 'contain' }}
                         />
                      ))}
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={7} sx={{ p: 4, bgcolor: '#fafafa', borderLeft: { md: '1px solid #eee' } }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    Product Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 1.5, mb: 3 }}>
                    <Typography color="text.secondary">Product Name</Typography>
                    <Typography fontWeight="bold">{selectedProduct.name}</Typography>
                    
                    <Typography color="text.secondary">Product Code</Typography>
                    <Box>
                      <Box sx={{ display: 'inline-block', bgcolor: 'primary.main', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {selectedProduct.variants[0]?.originalProduct.productNo || 'N/A'}
                      </Box>
                    </Box>

                    {(() => {
                      const uniqueColors = Array.from(new Set(selectedProduct.variants.map(v => v.color).filter(c => c !== 'Default')));
                      const uniqueSizes = Array.from(new Set(selectedProduct.variants.map(v => v.size).filter(s => s !== 'Standard' && s !== '')));
                      return (
                        <>
                          {uniqueColors.length > 0 && (
                            <>
                              <Typography color="text.secondary">Colors</Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                                {uniqueColors.map(c => (
                                  <Box key={c} title={c} sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: getColorCode(c), border: '1px solid', borderColor: c.toLowerCase().includes('white') ? 'grey.300' : 'rgba(0,0,0,0.1)' }} />
                                ))}
                              </Box>
                            </>
                          )}
                          {uniqueSizes.length > 0 && (
                            <>
                              <Typography color="text.secondary">Sizes / Packs</Typography>
                              <Typography>{uniqueSizes.join(', ')}</Typography>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </Box>




                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                     {selectedProduct.variants[0]?.originalProduct.tdsUrl && (
                        <Button variant="outlined" color="primary" startIcon={<Description />}
                          href={selectedProduct.variants[0].originalProduct.tdsUrl} target="_blank"
                          sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 'bold', px: 3 }}>
                          Download TDS
                        </Button>
                     )}
                     <Button variant="contained" color="secondary" startIcon={<AddShoppingCart />}
                       onClick={() => { setSelectedProduct(null); handleOpenAddToCart(selectedProduct); }}
                       sx={{ borderRadius: 50, textTransform: 'none', fontWeight: 'bold', px: 3, boxShadow: '0 4px 12px rgba(164,210,51,0.3)' }}>
                       Add to Order
                     </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sx={{ p: 4, bgcolor: 'white', borderTop: '1px solid #eee' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 4 }} />
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      Full Description & Specifications
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      typography: 'body1', 
                      color: 'text.primary',
                      lineHeight: 1.8,
                      '& p': { mb: 2 },
                      '& ul': { pl: 3, mb: 2 },
                      '& li': { mb: 1 }
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedProduct.description || 'No description available.' }}
                  />
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ── ADD TO CART DIALOG (variant selector only) ── */}
      <Dialog
        open={Boolean(addProduct)}
        onClose={() => setAddProduct(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {addProduct && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">{addProduct.name}</Typography>
              <IconButton onClick={() => setAddProduct(null)} sx={{ color: 'text.secondary' }}><Close /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '5fr 7fr' } }}>
                {/* Image */}
                <Box sx={{ p: 3, bgcolor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: { sm: '1px solid #eee' } }}>
                  <Box component="img"
                    src={activeImage || addProduct.images[0] || '/placeholder.jpg'}
                    sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 2, mb: 1.5 }}
                  />
                  {addProduct.images.length > 1 && (
                    <Box sx={{ display: 'flex', gap: 0.75, overflowX: 'auto', maxWidth: '100%' }}>
                      {addProduct.images.map((img, i) => (
                        <Box key={i} component="img" src={img} onClick={() => setActiveImage(img)}
                          sx={{ width: 48, height: 48, borderRadius: 1, cursor: 'pointer', objectFit: 'contain', border: activeImage === img ? '2px solid' : '1px solid', borderColor: activeImage === img ? 'primary.main' : 'grey.300' }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                {/* Selectors */}
                <Box sx={{ p: 3, bgcolor: '#fafafa' }}>
                  {(() => {
                    const uniqueColors = Array.from(new Set(addProduct.variants.map(v => v.color)));
                    const uniqueSizes = Array.from(new Set(addProduct.variants.filter(v => v.color === configColor).map(v => v.size)));
                    const currentVariant = addProduct.variants.find(v => v.color === configColor && v.size === configPackSize);
                    const displayPrice = currentVariant ? currentVariant.price : 0;
                    const isBulk = configQuantity >= 10;
                    const unitPrice = isBulk ? displayPrice * 0.53 : displayPrice * 0.55;
                    const totalPrice = unitPrice * configQuantity;
                    const price47 = displayPrice * 0.53;

                    return (
                      <>
                        <Box sx={{ mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                            <Typography variant="h4" color="secondary.main" fontWeight="bold">
                              Rs. {unitPrice.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                              Rs. {displayPrice.toFixed(2)}
                            </Typography>
                            {isBulk && (
                              <Box sx={{ bgcolor: 'secondary.main', color: 'white', px: 1, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold' }}>BULK 47%</Box>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">per unit</Typography>
                        </Box>

                        {configQuantity > 1 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, p: 1.5, bgcolor: 'rgba(164,210,51,0.1)', borderRadius: 1, border: '1px solid rgba(164,210,51,0.3)' }}>
                            <Typography variant="body1" fontWeight="bold" color="primary.dark">
                              Total: Rs. {totalPrice.toFixed(2)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({configQuantity} × Rs. {unitPrice.toFixed(2)})
                            </Typography>
                          </Box>
                        )}

                        <Typography variant="caption" sx={{ color: isBulk ? 'secondary.dark' : 'primary.main', fontWeight: 'bold', display: 'block', mb: 3 }}>
                          {isBulk ? `✓ Bulk discount applied (47%)` : `Order 10+ for bulk price: Rs. ${price47.toFixed(2)} / unit`}
                        </Typography>

                        {(uniqueColors.length > 1 || (uniqueColors.length === 1 && uniqueColors[0] !== 'Default')) && (
                          <Box sx={{ mb: 2.5 }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                              Color: <span style={{ fontWeight: 'normal', color: '#000' }}>{configColor}</span>
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                              {uniqueColors.map(c => (
                                <Box key={c} title={c}
                                  onClick={() => {
                                    setConfigColor(c);
                                    const sizesForColor = addProduct.variants.filter(v => v.color === c);
                                    if (sizesForColor.length > 0) {
                                      setConfigPackSize(sizesForColor[0].size);
                                      const img = sizesForColor[0].originalProduct.imageUrl;
                                      if (img) setActiveImage(img);
                                    }
                                  }}
                                  sx={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    bgcolor: getColorCode(c), cursor: 'pointer',
                                    border: configColor === c ? '2px solid' : '1px solid',
                                    borderColor: configColor === c ? 'primary.main' : (c.toLowerCase().includes('white') ? 'grey.300' : 'rgba(0,0,0,0.15)'),
                                    boxShadow: configColor === c ? '0 0 0 3px rgba(164,210,51,0.25)' : 'none',
                                    transform: configColor === c ? 'scale(1.12)' : 'none',
                                    transition: 'all 0.18s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}
                                >
                                  {configColor === c && (
                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.toLowerCase().includes('white') ? 'primary.main' : 'white' }} />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Box sx={{ mb: 2.5 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>Size / Pack</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {uniqueSizes.map(s => (
                              <Button key={s}
                                variant={configPackSize === s ? 'contained' : 'outlined'}
                                color={configPackSize === s ? 'primary' : 'inherit'}
                                onClick={() => {
                                  setConfigPackSize(s);
                                  const variant = addProduct.variants.find(v => v.color === configColor && v.size === s);
                                  if (variant?.originalProduct.imageUrl) setActiveImage(variant.originalProduct.imageUrl);
                                }}
                                sx={{ minWidth: 'auto', textTransform: 'none', borderRadius: 1, fontWeight: 'bold' }}
                              >
                                {s}
                              </Button>
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>Quantity</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: 'fit-content', border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                            <Button size="small" color="inherit" sx={{ minWidth: 40 }} onClick={() => setConfigQuantity(Math.max(1, configQuantity - 1))}>-</Button>
                            <Typography sx={{ px: 2.5, fontWeight: 'bold', fontSize: '1rem' }}>{configQuantity}</Typography>
                            <Button size="small" color="inherit" sx={{ minWidth: 40 }} onClick={() => setConfigQuantity(configQuantity + 1)}>+</Button>
                          </Box>
                        </Box>

                        <Button fullWidth variant="contained" color="secondary" size="large" startIcon={<AddShoppingCart />}
                          onClick={() => addToCart(addProduct, configQuantity, configPackSize, configColor)}
                          sx={{ borderRadius: 2, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(164,210,51,0.35)' }}>
                          Add to Order
                        </Button>
                      </>
                    );
                  })()}
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
      
      {/* Back to top FAB */}
      <Fab 
        color="secondary" 
        size="medium" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
        sx={{ position: 'fixed', bottom: 40, right: 32, zIndex: 1000 }}
      >
        <KeyboardArrowUp />
      </Fab>

      {/* Floating Watermark */}
      <Typography 
        variant="caption" 
        sx={{ 
          position: 'fixed', 
          bottom: 12, 
          right: 32, 
          zIndex: 1000, 
          color: 'white',
          mixBlendMode: 'difference',
          filter: 'grayscale(100%)',
          opacity: 0.5,
          fontSize: '0.65rem',
          fontWeight: '500',
          letterSpacing: 0.5,
          pointerEvents: 'none'
        }}
      >
        © Developed by Megakem
      </Typography>
    </Box>
  );
}

export default App;
