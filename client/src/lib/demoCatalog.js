const categoryNames = [
  'AC Service & Repair',
  'Home Cleaning',
  'Plumbing',
  'Electrical',
  'Salon at Home',
  'Appliance Repair',
  'Pest Control',
  'Painting'
];

export const demoCategories = categoryNames.map((name, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name
}));

const serviceInfo = [
  {
    name: 'AC Service & Repair',
    description: 'Get your air conditioner cleaned, checked, and ready to keep your home comfortable.',
    price: 499,
    duration: 60,
    image: 'photo-1621905251918-48416bd8575a',
    packageNames: ['Basic service', 'Deep service'],
    addonNames: ['Foam jet cleaning']
  },
  {
    name: 'Home Cleaning',
    description: 'A thoughtful top-to-bottom clean for the rooms you use every day.',
    price: 699,
    duration: 120,
    image: 'photo-1581578731548-c64695cc6952',
    packageNames: ['Essential clean', 'Full home clean'],
    addonNames: ['Inside kitchen cabinets']
  },
  {
    name: 'Plumbing',
    description: 'Help with everyday leaks, taps, drains, and other plumbing fixes.',
    price: 299,
    duration: 45,
    image: 'photo-1607472586893-edb57bdc0e39',
    packageNames: ['Inspection & repair'],
    addonNames: ['Additional fixture']
  },
  {
    name: 'Electrical',
    description: 'Get help with common electrical repairs and installations around your home.',
    price: 349,
    duration: 45,
    image: 'photo-1621905251918-48416bd8575a',
    packageNames: ['Electrical inspection'],
    addonNames: ['Install one fixture']
  },
  {
    name: 'Salon at Home',
    description: 'Enjoy personal care services from the comfort of your home.',
    price: 399,
    duration: 60,
    image: 'photo-1560066984-138dadb4c035',
    packageNames: ['Essential care', 'Complete care'],
    addonNames: ['Add a head massage']
  },
  {
    name: 'Appliance Repair',
    description: 'Get common household appliances checked by a local service professional.',
    price: 449,
    duration: 60,
    image: 'photo-1581091226825-a6a2a5aee158',
    packageNames: ['Diagnosis & repair'],
    addonNames: ['Priority visit']
  },
  {
    name: 'Pest Control',
    description: 'A home treatment visit for common household pest concerns.',
    price: 699,
    duration: 90,
    image: 'photo-1563207153-f403bf289096',
    packageNames: ['One room', 'Full home'],
    addonNames: ['Balcony treatment']
  },
  {
    name: 'Painting',
    description: 'Refresh a room with careful surface preparation and a clean finish.',
    price: 1999,
    duration: 180,
    image: 'photo-1562259949-e8e7689d7828',
    packageNames: ['One room refresh'],
    addonNames: ['Wall touch-ups']
  }
];

function demoUuid(value) {
  return `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`;
}

export const demoServices = serviceInfo.map((item, index) => {
  const serviceId = demoUuid(index + 101);
  const category = demoCategories[index];
  return {
    id: serviceId,
    name: item.name,
    slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    category,
    shortDescription: item.description,
    description: item.description,
    basePrice: item.price,
    effectivePrice: item.price,
    currency: 'INR',
    durationMinutes: item.duration,
    images: [{
      imageUrl: `https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=960&q=82`,
      altText: `${item.name} sample photo`
    }],
    packages: item.packageNames.map((name, packageIndex) => ({
      id: demoUuid(201 + index * 2 + packageIndex),
      name,
      description: `Sample ${name.toLowerCase()} package for ${item.name.toLowerCase()}.`,
      price: item.price + packageIndex * Math.max(100, Math.round(item.price * 0.35)),
      durationMinutes: item.duration + packageIndex * 30,
      features: ['Professional home service', 'Clear upfront estimate']
    })),
    addons: item.addonNames.map((name, addonIndex) => ({
      id: demoUuid(401 + index * 2 + addonIndex),
      name,
      description: `Optional ${name.toLowerCase()} add-on.`,
      price: Math.max(99, Math.round(item.price * 0.2)),
      durationMinutes: 20
    })),
    isDemo: true
  };
});

export function filterDemoServices(services, {
  q = '',
  categoryId = '',
  minPrice,
  maxPrice,
  minDuration,
  sortBy = 'name',
  order = 'asc'
} = {}) {
  const search = q.trim().toLowerCase();
  const filtered = services.filter((service) => {
    const price = Number(service.effectivePrice ?? service.basePrice);
    const duration = Number(service.durationMinutes || 0);
    const searchable = `${service.name} ${service.category?.name || ''} ${service.description || ''}`.toLowerCase();
    return (!search || searchable.includes(search))
      && (!categoryId || service.category?.id === categoryId)
      && (minPrice === undefined || minPrice === '' || price >= Number(minPrice))
      && (maxPrice === undefined || maxPrice === '' || price <= Number(maxPrice))
      && (minDuration === undefined || minDuration === '' || duration >= Number(minDuration));
  });

  filtered.sort((left, right) => {
    const leftValue = sortBy === 'price' ? Number(left.effectivePrice ?? left.basePrice)
      : sortBy === 'duration' ? Number(left.durationMinutes || 0)
        : String(left.name).toLowerCase();
    const rightValue = sortBy === 'price' ? Number(right.effectivePrice ?? right.basePrice)
      : sortBy === 'duration' ? Number(right.durationMinutes || 0)
        : String(right.name).toLowerCase();
    const comparison = typeof leftValue === 'string'
      ? leftValue.localeCompare(rightValue)
      : leftValue - rightValue;
    return order === 'desc' ? -comparison : comparison;
  });

  return filtered;
}

export function getDemoService(serviceId) {
  return demoServices.find((service) => service.id === serviceId) || null;
}
