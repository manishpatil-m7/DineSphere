"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminData = seedAdminData;
async function seedAdminData(prisma) {
    try {
        // 1. Settings (single row)
        const existingSettings = await prisma.restaurantSetting.findFirst();
        if (!existingSettings) {
            await prisma.restaurantSetting.create({
                data: {
                    restaurant_name: 'DineSphere Luxury Dining',
                    phone: '+91 98765 43210',
                    address: 'Palms Boulevard, Marine Drive, Mumbai',
                    tax_percent: 5.0,
                    points_per_rupees: 10.0,
                    reservation_slots: JSON.stringify(['12:00', '13:30', '15:00', '18:30', '19:30', '20:30', '21:30']),
                    max_days_ahead: 14,
                    hold_minutes: 5,
                    cancel_window_hours: 2,
                    max_tables_per_booking: 4,
                    is_accepting_orders: true
                }
            });
            console.log('[ADMIN SEED] Initialized restaurant settings');
        }
        // 2. Customers (Removed fake customers for production. Customers should register normally.)
        const customerMap = {};
        // 3. Inventory Items (20 items, with 3 items under threshold)
        const inventoryData = [
            { name: 'Paneer (Fresh Cottage Cheese)', unit: 'kg', quantity: 24.5, low_threshold: 10, cost_per_unit: 320 },
            { name: 'Chicken Breast (Boneless)', unit: 'kg', quantity: 35.0, low_threshold: 15, cost_per_unit: 260 },
            { name: 'Basmati Rice (Aged)', unit: 'kg', quantity: 80.0, low_threshold: 25, cost_per_unit: 110 },
            { name: 'Wheat Flour (Organic)', unit: 'kg', quantity: 45.0, low_threshold: 20, cost_per_unit: 55 },
            { name: 'Mozzarella Cheese (Fior di Latte)', unit: 'kg', quantity: 18.0, low_threshold: 8, cost_per_unit: 580 },
            { name: 'Cold Pressed Cooking Oil', unit: 'litre', quantity: 40.0, low_threshold: 15, cost_per_unit: 190 },
            { name: 'San Marzano Vine Tomatoes', unit: 'kg', quantity: 30.0, low_threshold: 12, cost_per_unit: 75 },
            { name: 'Fresh Full Cream Milk', unit: 'litre', quantity: 25.0, low_threshold: 10, cost_per_unit: 68 },
            { name: 'Arabica Coffee Beans (Single Origin)', unit: 'kg', quantity: 12.0, low_threshold: 5, cost_per_unit: 950 },
            { name: 'Kashmiri Saffron (Grade A)', unit: 'piece', quantity: 3.0, low_threshold: 5, cost_per_unit: 450 }, // LOW
            { name: 'Black Truffle Oil (Italian)', unit: 'litre', quantity: 1.5, low_threshold: 3, cost_per_unit: 2800 }, // LOW
            { name: 'Atlantic Salmon Fillet', unit: 'kg', quantity: 2.8, low_threshold: 6, cost_per_unit: 1400 }, // LOW
            { name: 'Australian Lamb Chops', unit: 'kg', quantity: 14.0, low_threshold: 8, cost_per_unit: 1100 },
            { name: 'French Cultured Butter', unit: 'kg', quantity: 22.0, low_threshold: 10, cost_per_unit: 520 },
            { name: 'Heavy Dairy Cream', unit: 'litre', quantity: 16.0, low_threshold: 8, cost_per_unit: 240 },
            { name: 'Organic Red Onions', unit: 'kg', quantity: 50.0, low_threshold: 20, cost_per_unit: 40 },
            { name: 'Peeled Garlic Cloves', unit: 'kg', quantity: 15.0, low_threshold: 6, cost_per_unit: 140 },
            { name: 'Russet Potatoes', unit: 'kg', quantity: 60.0, low_threshold: 20, cost_per_unit: 35 },
            { name: 'Ceremonial Matcha Powder', unit: 'kg', quantity: 4.5, low_threshold: 2, cost_per_unit: 3200 },
            { name: 'Valrhona Dark Chocolate 70%', unit: 'kg', quantity: 9.0, low_threshold: 4, cost_per_unit: 1650 }
        ];
        const inventoryIdMap = {};
        for (const item of inventoryData) {
            const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
            if (!existing) {
                const created = await prisma.inventoryItem.create({
                    data: {
                        name: item.name,
                        unit: item.unit,
                        minStock: item.low_threshold,
                        costPerUnit: item.cost_per_unit,
                        quantity: item.quantity,
                        low_threshold: item.low_threshold,
                        cost_per_unit: item.cost_per_unit
                    }
                });
                inventoryIdMap[item.name] = created.id;
            }
            else {
                inventoryIdMap[item.name] = existing.id;
            }
        }
        console.log('[ADMIN SEED] Verified 20 inventory items (3 low stock)');
        // 4. Link Recipe Ingredients to Dishes (10 dishes)
        const dishes = await prisma.dish.findMany();
        const dishMap = new Map(dishes.map(d => [d.name, d.id]));
        const recipeDefinitions = [
            {
                dishName: 'Crispy Truffle Arancini',
                ingredients: [
                    { itemName: 'Basmati Rice (Aged)', qty: 0.12 },
                    { itemName: 'Mozzarella Cheese (Fior di Latte)', qty: 0.05 },
                    { itemName: 'Black Truffle Oil (Italian)', qty: 0.01 },
                    { itemName: 'Cold Pressed Cooking Oil', qty: 0.05 }
                ]
            },
            {
                dishName: 'Smoked Salmon Bruschetta',
                ingredients: [
                    { itemName: 'Atlantic Salmon Fillet', qty: 0.15 },
                    { itemName: 'Wheat Flour (Organic)', qty: 0.08 },
                    { itemName: 'French Cultured Butter', qty: 0.02 }
                ]
            },
            {
                dishName: 'Spicy Peri-Peri Paneer Bites',
                ingredients: [
                    { itemName: 'Paneer (Fresh Cottage Cheese)', qty: 0.2 },
                    { itemName: 'Cold Pressed Cooking Oil', qty: 0.04 },
                    { itemName: 'Peeled Garlic Cloves', qty: 0.02 }
                ]
            },
            {
                dishName: 'Saffron Butter Chicken',
                ingredients: [
                    { itemName: 'Chicken Breast (Boneless)', qty: 0.28 },
                    { itemName: 'French Cultured Butter', qty: 0.04 },
                    { itemName: 'Heavy Dairy Cream', qty: 0.06 },
                    { itemName: 'San Marzano Vine Tomatoes', qty: 0.15 },
                    { itemName: 'Kashmiri Saffron (Grade A)', qty: 0.05 }
                ]
            },
            {
                dishName: 'Wild Forest Mushroom Risotto',
                ingredients: [
                    { itemName: 'Basmati Rice (Aged)', qty: 0.18 },
                    { itemName: 'French Cultured Butter', qty: 0.03 },
                    { itemName: 'Heavy Dairy Cream', qty: 0.04 },
                    { itemName: 'Peeled Garlic Cloves', qty: 0.01 }
                ]
            },
            {
                dishName: 'Grilled Lamb Chops Rosemary',
                ingredients: [
                    { itemName: 'Australian Lamb Chops', qty: 0.35 },
                    { itemName: 'Russet Potatoes', qty: 0.15 },
                    { itemName: 'French Cultured Butter', qty: 0.03 }
                ]
            },
            {
                dishName: 'Molten Valrhona Lava Cake',
                ingredients: [
                    { itemName: 'Valrhona Dark Chocolate 70%', qty: 0.1 },
                    { itemName: 'French Cultured Butter', qty: 0.04 },
                    { itemName: 'Wheat Flour (Organic)', qty: 0.03 },
                    { itemName: 'Fresh Full Cream Milk', qty: 0.05 }
                ]
            },
            {
                dishName: 'Pistachio Matcha Tiramisu',
                ingredients: [
                    { itemName: 'Ceremonial Matcha Powder', qty: 0.02 },
                    { itemName: 'Heavy Dairy Cream', qty: 0.08 },
                    { itemName: 'Fresh Full Cream Milk', qty: 0.05 }
                ]
            },
            {
                dishName: 'Royal Mango Cardamom Lassi',
                ingredients: [
                    { itemName: 'Fresh Full Cream Milk', qty: 0.25 },
                    { itemName: 'Heavy Dairy Cream', qty: 0.03 }
                ]
            },
            {
                dishName: 'Cold Brew Nitro Tonic',
                ingredients: [
                    { itemName: 'Arabica Coffee Beans (Single Origin)', qty: 0.04 }
                ]
            }
        ];
        const existingIngCount = await prisma.dishIngredient.count();
        if (existingIngCount === 0) {
            for (const recipe of recipeDefinitions) {
                const dishId = dishMap.get(recipe.dishName);
                if (dishId) {
                    for (const ing of recipe.ingredients) {
                        const itemId = inventoryIdMap[ing.itemName];
                        if (itemId) {
                            await prisma.dishIngredient.create({
                                data: {
                                    dish_id: dishId,
                                    item_id: itemId,
                                    qty_per_dish: ing.qty
                                }
                            });
                        }
                    }
                }
            }
            console.log('[ADMIN SEED] Linked recipe ingredients to 10 signature dishes');
        }
        // 5. Table Blocks (2 blocks)
        const existingBlocks = await prisma.tableBlock.count();
        if (existingBlocks === 0) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];
            const tableA1 = await prisma.floorTable.findUnique({ where: { label: 'A1' } });
            const tableB2 = await prisma.floorTable.findUnique({ where: { label: 'B2' } });
            if (tableA1) {
                await prisma.tableBlock.create({
                    data: {
                        table_id: tableA1.id,
                        date: dateStr,
                        time_slot: '20:30',
                        reason: 'Reserved for VIP Ambassador delegation'
                    }
                });
            }
            if (tableB2) {
                await prisma.tableBlock.create({
                    data: {
                        table_id: tableB2.id,
                        date: dateStr,
                        time_slot: null, // Whole day
                        reason: 'Undergoing custom woodwork polish & maintenance'
                    }
                });
            }
            console.log('[ADMIN SEED] Created 2 sample table blocks');
        }
        // 6. Walk-in Reservation
        // (Removed fake walk-in reservation for production)
        // 7. Reviews
        // (Removed fake reviews for production)
        // 8. Support Tickets
        // (Removed fake support tickets for production)
        // 9. Historical Orders
        // (Removed fake historical orders for production)
        // 10. Initial Admin Actions
        const actionCount = await prisma.adminAction.count();
        if (actionCount === 0) {
            await prisma.adminAction.create({
                data: {
                    action: 'SYSTEM_INIT',
                    entity: 'Settings',
                    details: JSON.stringify({ message: 'DineSphere Luxury Dining Admin Console initialized' })
                }
            });
        }
    }
    catch (err) {
        console.error('[ADMIN SEED ERROR]:', err);
    }
}
