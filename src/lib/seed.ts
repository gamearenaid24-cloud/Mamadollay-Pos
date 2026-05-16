import { db, auth } from './firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export async function seedDemoData() {
  const usersSnap = await getDocs(collection(db, 'users'));
  if (!usersSnap.empty) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding demo data...');
  const batch = writeBatch(db);

  // 1. Create Default Outlet
  const outletId = 'outlet-jkt-01';
  batch.set(doc(db, 'outlets', outletId), {
    name: 'Central Mall JKT',
    address: 'Jl. Sudirman No. 1, Jakarta',
    phone: '021-12345678',
    createdAt: serverTimestamp()
  });

  // 2. Create Categories
  const categories = ['Elektronik', 'Fashion', 'Makanan', 'Minuman'];
  categories.forEach((cat, i) => {
    batch.set(doc(db, 'categories', `cat-${i}`), { name: cat });
  });

  // 3. Create Products & Stocks
  const products = [
    { id: 'p1', name: 'Original Latte', sku: 'DRK-001', catId: 'cat-3', price: 35000, cost: 15000 },
    { id: 'p2', name: 'Croissant Almond', sku: 'FSN-001', catId: 'cat-2', price: 28000, cost: 12000 },
    { id: 'p3', name: 'Espresso Single', sku: 'DRK-002', catId: 'cat-3', price: 20000, cost: 8000 },
    { id: 'p4', name: 'Tuna Sandwich', sku: 'FOD-001', catId: 'cat-2', price: 45000, cost: 22000 },
  ];

  products.forEach(p => {
    batch.set(doc(db, 'products', p.id), {
      name: p.name,
      sku: p.sku,
      categoryId: p.catId,
      price: p.price,
      cost: p.cost,
      createdAt: serverTimestamp()
    });
    batch.set(doc(db, 'stocks', `${p.id}-${outletId}`), {
      productId: p.id,
      outlet_id: outletId,
      qty: Math.floor(Math.random() * 100) + 20
    });
  });

  // 4. Create User in Auth & Firestore
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@mail.com', '123456');
    batch.set(doc(db, 'users', userCredential.user.uid), {
      name: 'Aditama Putra',
      email: 'admin@mail.com',
      role: 'admin',
      outlet_id: outletId,
      createdAt: serverTimestamp()
    });
  } catch (e: any) {
    if (e.code !== 'auth/email-already-in-use') {
      throw e;
    }
  }

  await batch.commit();
  console.log('Seeding complete!');
}
