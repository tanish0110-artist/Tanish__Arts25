
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { CartPage } from './pages/CartPage';
import { AccountPage } from './pages/AccountPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { StyleAdvisorPage } from './pages/StyleAdvisorPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { VisualHarmonyPage } from './pages/VisualHarmonyPage';
import { CategoryPage } from './pages/CategoryPage';
import { WishlistPage } from './pages/WishlistPage'; 
import { ToastContainer } from './components/ToastContainer';
import { Product, CartState, User, Review, ToastMessage, ToastType, Address, LiveLocationState } from './types';
import { INITIAL_PRODUCTS } from './constants';

const App: React.FC = () => {
  const [productsData, setProductsData] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartState>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : {};
  });
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [wishlist, setWishlist] = useState<number[]>(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const savedRegisteredUsers = localStorage.getItem('registeredUsers');
    return savedRegisteredUsers ? JSON.parse(savedRegisteredUsers) : [];
  });
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const savedAddresses = localStorage.getItem('addresses');
    return savedAddresses ? JSON.parse(savedAddresses) : [];
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(() => {
    const savedSelectedAddressId = localStorage.getItem('selectedAddressId');
    return savedSelectedAddressId ? JSON.parse(savedSelectedAddressId) : null;
  });
  const [liveLocation, setLiveLocation] = useState<LiveLocationState>({
    coords: null,
    city: null, // Placeholder for city name after reverse geocoding
    error: null,
    loading: false,
  });

  const navigate = useNavigate();

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);
  
  useEffect(() => {
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('addresses', JSON.stringify(addresses));
    if (selectedAddressId && !addresses.find(a => a.id === selectedAddressId)) {
        const defaultAddress = addresses.find(a => a.isDefault);
        setSelectedAddressId(defaultAddress ? defaultAddress.id : (addresses.length > 0 ? addresses[0].id : null));
    } else if (!selectedAddressId && addresses.length > 0) {
        const defaultAddress = addresses.find(a => a.isDefault);
        setSelectedAddressId(defaultAddress ? defaultAddress.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (selectedAddressId) {
        localStorage.setItem('selectedAddressId', JSON.stringify(selectedAddressId));
    } else {
        localStorage.removeItem('selectedAddressId');
    }
  }, [selectedAddressId]);

  const fetchLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLiveLocation(prev => ({ ...prev, error: "Geolocation is not supported by your browser.", loading: false }));
      addToast("Geolocation is not supported by your browser.", "warning");
      return;
    }

    setLiveLocation(prev => ({ ...prev, loading: true, error: null, city: null, coords: null }));
    addToast("Fetching your current location...", "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // In a real app, you'd use position.coords.latitude and position.coords.longitude
        // to call a reverse geocoding API to get the city.
        // For this demo, we'll use a placeholder.
        const mockCity = "Your Current Location"; // Or `City near ${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`
        setLiveLocation({
          coords: position.coords,
          city: mockCity,
          error: null,
          loading: false,
        });
        addToast(`Location updated: ${mockCity}`, "success");
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                errorMessage = "The request to get user location timed out.";
                break;
            default:
                errorMessage = "An unknown error occurred while fetching location.";
                break;
        }
        setLiveLocation(prev => ({ ...prev, error: errorMessage, loading: false, city: null, coords: null }));
        addToast(errorMessage, "error");
      },
      { timeout: 10000 } // 10 second timeout
    );
  }, [addToast]);


  const addAddress = useCallback((newAddressData: Omit<Address, 'id' | 'isDefault'>, makeDefault: boolean) => {
    setAddresses(prevAddresses => {
      const newId = `addr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let updatedAddresses = prevAddresses.map(addr => ({ ...addr, isDefault: false }));
      
      const completeNewAddress: Address = {
        ...newAddressData,
        id: newId,
        isDefault: makeDefault,
      };

      if (makeDefault) {
        updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        setSelectedAddressId(newId);
      } else if (updatedAddresses.length === 0) { 
        completeNewAddress.isDefault = true;
        setSelectedAddressId(newId);
      }
      
      updatedAddresses.push(completeNewAddress);
      
      if (makeDefault) {
        // This is handled
      } else if (!updatedAddresses.some(a => a.isDefault) && updatedAddresses.length > 0) {
          updatedAddresses[0].isDefault = true;
          setSelectedAddressId(updatedAddresses[0].id);
      }

      addToast('Address added successfully!', 'success');
      return updatedAddresses;
    });
  }, [addToast]);

  const deleteAddress = useCallback((addressId: string) => {
    setAddresses(prevAddresses => {
      const addressToDelete = prevAddresses.find(addr => addr.id === addressId);
      if (!addressToDelete) return prevAddresses;

      const updatedAddresses = prevAddresses.filter(addr => addr.id !== addressId);
      
      if (addressToDelete.isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true; 
        setSelectedAddressId(updatedAddresses[0].id);
      } else if (updatedAddresses.length === 0) {
        setSelectedAddressId(null);
      } else if (selectedAddressId === addressId) { 
        const newDefault = updatedAddresses.find(a => a.isDefault) || updatedAddresses[0];
        setSelectedAddressId(newDefault.id);
      }

      addToast('Address deleted.', 'info');
      return updatedAddresses;
    });
  }, [addToast, selectedAddressId]);
  
  const setDefaultAddress = useCallback((addressId: string) => {
    setAddresses(prevAddresses =>
      prevAddresses.map(addr =>
        addr.id === addressId
          ? { ...addr, isDefault: true }
          : { ...addr, isDefault: false }
      )
    );
    setSelectedAddressId(addressId);
    setLiveLocation(prev => ({...prev, city: null, coords: null, error: null})); // Clear live location if a saved one is set as default
    addToast('Default address updated.', 'success');
  }, [addToast]);


  const addToCart = useCallback((productId: number, productName: string) => {
    if (!user) {
      addToast("Please sign in to add items to your cart.", 'warning');
      navigate('/account');
      return;
    }
    setCart(prevCart => ({
      ...prevCart,
      [productId]: (prevCart[productId] || 0) + 1,
    }));
    addToast(`${productName} added to cart!`, 'success');
  }, [addToast, user, navigate]);

  const removeFromCart = useCallback((productId: number, productName: string) => {
    setCart(prevCart => {
      const newCart = { ...prevCart };
      delete newCart[productId];
      return newCart;
    });
    addToast(`${productName} removed from cart.`, 'info');
  }, [addToast]);

  const handleLogin = useCallback((username: string, password?: string) => {
    const foundUser = registeredUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (foundUser) {
      setUser({ username: foundUser.username }); 
      addToast(`Logged in as ${username}. Welcome!`, 'success');
      navigate('/');
    } else {
      const userWithoutPasswordCheck = registeredUsers.find(u => u.username === username);
      if(userWithoutPasswordCheck && !userWithoutPasswordCheck.password && !password) {
        setUser({ username: userWithoutPasswordCheck.username });
        addToast(`Logged in as ${username}. Welcome!`, 'success');
        navigate('/');
      } else {
        addToast('Invalid username or password.', 'error');
      }
    }
  }, [navigate, addToast, registeredUsers]);
  
  const handleSignUp = useCallback((username: string, password?: string) => {
    if (registeredUsers.find(u => u.username === username)) {
      addToast('Username already taken. Please choose another.', 'error');
      return false;
    }
    const newUser: User = { username, password }; 
    setRegisteredUsers(prevUsers => [...prevUsers, newUser]);
    setUser({ username }); 
    addToast(`Account created for ${username}! You are now logged in.`, 'success');
    navigate('/');
    return true;
  }, [registeredUsers, navigate, addToast, setUser]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setLiveLocation({ coords: null, city: null, error: null, loading: false }); // Clear live location on logout
    // setSelectedAddressId(null); // Optionally clear selected address on logout
    addToast('Logged out successfully.', 'info');
    navigate('/');
  }, [navigate, addToast]);
  
  const handleBuyNow = useCallback((productId: number, productName: string) => {
    if (!user) {
      addToast("Please sign in to proceed with your purchase.", 'warning');
      navigate('/account');
      return;
    }
    setCart({ [productId]: 1 }); 
    addToast(`Proceeding to checkout with ${productName}.`, 'info');
    navigate('/checkout');
  }, [navigate, setCart, addToast, user]);

  const addReviewToProduct = useCallback((productId: number, review: Review) => {
    setProductsData(prevProducts =>
      prevProducts.map(p =>
        p.id === productId
          ? { ...p, reviews: [...(p.reviews || []), review] }
          : p
      )
    );
    addToast('Review submitted successfully!', 'success');
  }, [addToast]);

  const cartItemCount = Object.values(cart).reduce((sum: number, qty: number) => sum + qty, 0);
  const wishlistItemCount = wishlist.length;

  const addToWishlist = useCallback((productId: number, productName: string) => {
    if (!user) {
      addToast("Please sign in to add items to your wishlist.", 'warning');
      navigate('/account');
      return;
    }
    setWishlist(prevWishlist => {
      if (!prevWishlist.includes(productId)) {
        addToast(`${productName} added to wishlist!`, 'success');
        return [...prevWishlist, productId];
      }
      addToast(`${productName} is already in your wishlist.`, 'info');
      return prevWishlist;
    });
  }, [addToast, user, navigate]);

  const removeFromWishlist = useCallback((productId: number, productName: string) => {
    setWishlist(prevWishlist => prevWishlist.filter(id => id !== productId));
    addToast(`${productName} removed from wishlist.`, 'info');
  }, [addToast]);

  const isProductInWishlist = useCallback((productId: number): boolean => {
    return wishlist.includes(productId);
  }, [wishlist]);

  const currentSelectedAddress = useMemo(() => {
    if (!selectedAddressId) return addresses.find(a => a.isDefault) || addresses[0] || null;
    return addresses.find(a => a.id === selectedAddressId) || addresses.find(a => a.isDefault) || addresses[0] || null;
  }, [addresses, selectedAddressId]);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100">
      <Header 
        cartItemCount={cartItemCount} 
        wishlistItemCount={wishlistItemCount} 
        selectedAddress={currentSelectedAddress}
        user={user}
        onLogout={handleLogout}
        liveLocation={liveLocation}
        onFetchLiveLocation={fetchLiveLocation}
        addToast={addToast}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <main className="flex-grow py-5 px-4 sm:px-6 lg:px-8 w-full">
        <Routes>
          <Route 
            path="/" 
            element={<HomePage 
                        products={productsData} 
                        addToCart={addToCart} 
                        addToWishlist={addToWishlist} 
                        removeFromWishlist={removeFromWishlist} 
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow} 
                      />} 
          />
          <Route 
            path="/product/:id" 
            element={<ProductDetailsPage 
                        products={productsData} 
                        addToCart={addToCart} 
                        addToWishlist={addToWishlist} 
                        removeFromWishlist={removeFromWishlist} 
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow}
                        addReviewToProduct={addReviewToProduct}
                        currentUser={user}
                        addToast={addToast}
                        selectedAddress={currentSelectedAddress}
                        liveLocation={liveLocation}
                        onFetchLiveLocation={fetchLiveLocation}
                      />} 
          />
          <Route 
            path="/cart" 
            element={<CartPage 
                        cart={cart} 
                        products={productsData} 
                        removeFromCart={removeFromCart} 
                        addToCart={addToCart}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow}
                        addToast={addToast}
                        user={user}
                      />} 
          />
          <Route 
            path="/account" 
            element={<AccountPage 
                        user={user} 
                        onLogin={handleLogin} 
                        onLogout={handleLogout} 
                        onSignUp={handleSignUp}
                        addToast={addToast} 
                        addresses={addresses}
                        onAddAddress={addAddress}
                        onDeleteAddress={deleteAddress}
                        onSetDefaultAddress={setDefaultAddress}
                        selectedAddressId={selectedAddressId}
                        setSelectedAddressId={setSelectedAddressId}
                        onFetchLiveLocation={fetchLiveLocation}
                        liveLocationError={liveLocation.error}
                      />} 
          />
          <Route 
            path="/search" 
            element={<SearchResultsPage 
                        products={productsData} 
                        addToCart={addToCart} 
                        addToWishlist={addToWishlist} 
                        removeFromWishlist={removeFromWishlist} 
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow} 
                      />} 
          />
          <Route 
            path="/style-advisor" 
            element={<StyleAdvisorPage 
                        allProducts={productsData} 
                        addToCart={addToCart} 
                        addToWishlist={addToWishlist} 
                        removeFromWishlist={removeFromWishlist} 
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow} 
                        addToast={addToast}
                        user={user}
                      />} 
          />
          <Route 
            path="/checkout" 
            element={<CheckoutPage 
                        cart={cart} 
                        products={productsData} 
                        setCart={setCart} 
                        addToast={addToast}
                        user={user}
                        addresses={addresses}
                        selectedAddress={currentSelectedAddress}
                        onAddAddress={addAddress}
                        liveLocation={liveLocation}
                        onFetchLiveLocation={fetchLiveLocation} 
                      />} 
          />
          <Route 
            path="/visual-harmony" 
            element={<VisualHarmonyPage 
                        allProducts={productsData}
                        addToCart={addToCart}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow}
                        addToast={addToast}
                        user={user}
                      />}
          />
          <Route 
            path="/category/:categoryName" 
            element={<CategoryPage 
                        products={productsData} 
                        addToCart={addToCart}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow} 
                      />} 
          />
          <Route 
            path="/wishlist" 
            element={<WishlistPage 
                        wishlistProductIds={wishlist} 
                        allProducts={productsData} 
                        addToCart={addToCart}
                        addToWishlist={addToWishlist}
                        removeFromWishlist={removeFromWishlist}
                        isProductInWishlist={isProductInWishlist}
                        onBuyNow={handleBuyNow}
                        addToast={addToast}
                      />} 
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

