"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting seeding...');
    // 1. Roles & Users
    const roles = ['ADMIN', 'MANAGER', 'KITCHEN', 'DELIVERY', 'CUSTOMER'];
    const adminPassword = await bcrypt_1.default.hash('Admin@12345', 10);
    await prisma.user.upsert({
        where: { email: 'admin@dinesphere.test' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@dinesphere.test',
            password: adminPassword,
            role: 'ADMIN',
            phone: '1234567890'
        }
    });
    const managerPassword = await bcrypt_1.default.hash('Manager@12345', 10);
    await prisma.user.upsert({
        where: { email: 'manager@dinesphere.test' },
        update: {},
        create: {
            name: 'Restaurant Manager',
            email: 'manager@dinesphere.test',
            password: managerPassword,
            role: 'MANAGER'
        }
    });
    const kitchenPassword = await bcrypt_1.default.hash('Kitchen@12345', 10);
    await prisma.user.upsert({
        where: { email: 'kitchen@dinesphere.test' },
        update: {},
        create: {
            name: 'Head Chef',
            email: 'kitchen@dinesphere.test',
            password: kitchenPassword,
            role: 'KITCHEN'
        }
    });
    // Note: Customers should register naturally through the app.
    // 2. Categories & Menu Items
    const catStarters = await prisma.menuCategory.upsert({ where: { name: 'Starters' }, update: {}, create: { name: 'Starters' } });
    const catMains = await prisma.menuCategory.upsert({ where: { name: 'Main Course' }, update: {}, create: { name: 'Main Course' } });
    const catDesserts = await prisma.menuCategory.upsert({ where: { name: 'Desserts' }, update: {}, create: { name: 'Desserts' } });
    const catDrinks = await prisma.menuCategory.upsert({ where: { name: 'Beverages' }, update: {}, create: { name: 'Beverages' } });
    const menuItems = [
        { name: 'Truffle Fries', description: 'Crispy fries with truffle oil and parmesan', price: 8.99, categoryId: catStarters.id, isVegetarian: true, spiceLevel: 0, isFeatured: true },
        { name: 'Spicy Garlic Prawns', description: 'Prawns cooked in garlic butter and chili flakes', price: 14.99, categoryId: catStarters.id, isVegetarian: false, spiceLevel: 2 },
        { name: 'Grilled Ribeye Steak', description: '10oz Ribeye with mashed potatoes', price: 34.99, categoryId: catMains.id, isVegetarian: false, spiceLevel: 0, isPopular: true },
        { name: 'Mushroom Risotto', description: 'Creamy arborio rice with wild mushrooms', price: 18.99, categoryId: catMains.id, isVegetarian: true, spiceLevel: 0 },
        { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a gooey center', price: 9.99, categoryId: catDesserts.id, isVegetarian: true, spiceLevel: 0, isPopular: true },
        { name: 'Matcha Tiramisu', description: 'Classic tiramisu with a matcha twist', price: 8.99, categoryId: catDesserts.id, isVegetarian: true, spiceLevel: 0 },
        { name: 'Artisan Lemonade', description: 'Freshly squeezed lemonade with mint', price: 4.99, categoryId: catDrinks.id, isVegetarian: true, spiceLevel: 0 },
        { name: 'Craft Beer', description: 'Local IPA', price: 6.99, categoryId: catDrinks.id, isVegetarian: true, spiceLevel: 0 },
    ];
    for (const item of menuItems) {
        const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
        if (!existing)
            await prisma.menuItem.create({ data: item });
    }
    // 3. Tables
    const tableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    for (const num of tableNumbers) {
        await prisma.restaurantTable.upsert({
            where: { number: num },
            update: {},
            create: { number: num, capacity: num <= 4 ? 2 : 4, location: num <= 5 ? 'Indoor' : 'Patio' }
        });
    }
    // 4. Coupons
    await prisma.coupon.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: { code: 'WELCOME10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 20 }
    });
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
