const categoryList = [
  {
    name: 'Full Home/ By Room Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Statement design wall',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Living & Bedroom Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Native Water Purifier',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    isNew: true
  },
  {
    name: 'Native Smart Locks',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Cleaning',
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Plumbing',
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Electrical',
    imageUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Salon at Home',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Appliance Repair',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Pest Control',
    imageUrl: 'https://images.unsplash.com/photo-1563207153-f403bf289096?auto=format&fit=crop&w=600&q=80',
    isNew: false
  },
  {
    name: 'Painting',
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
    isNew: false
  }
];

export const demoCategories = categoryList.map((item, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: item.name,
  imageUrl: item.imageUrl,
  isNew: item.isNew
}));

const serviceInfo = [
  {
    name: 'Threading',
    description: 'Precise and gentle eyebrow and facial hair removal using organic cotton thread.',
    price: 49,
    duration: 10,
    image: 'photo-1560066984-138dadb4c035',
    packageNames: ['Eyebrows', 'Upper lip', 'Chin', 'Forehead', 'Full face', 'Sideburns', 'Jawline', 'Eyebrows + Upper lip'],
    addonNames: ['Soothing aloe gel massage']
  },
  {
    name: 'Intense cleaning (2 bathroom)',
    description: 'Machine scrubbing for tiles, hard water stain removal, disinfection of toilet and fittings.',
    price: 918,
    duration: 60,
    image: 'photo-1584622650111-993a426fbf0a',
    packageNames: ['2 Bathrooms deep scrub'],
    addonNames: ['Exhaust fan degreasing']
  },
  {
    name: 'Foam-jet AC service',
    description: 'High-pressure 2X deeper foam jet cleaning of indoor cooling coils and outdoor unit.',
    price: 599,
    duration: 60,
    image: 'photo-1621905252507-b35492cc74b4',
    packageNames: ['1 Split AC', '2 Split AC', '3 Split AC', 'Window AC', 'Anti-rust spray', 'Gas top-up', 'Drain pipe repair', 'PCB overhaul', 'Full diagnostic'],
    addonNames: ['Outdoor unit foam jet wash']
  },
  {
    name: 'Fabric sofa cleaning',
    description: 'Deep vacuuming, industrial foam shampooing, and wet extraction for fabric sofas.',
    price: 399,
    duration: 45,
    image: 'photo-1555041469-a586c61ea9bc',
    packageNames: ['3-seater sofa', '4-seater sofa', '5-seater L-shape', 'Cushion deep clean'],
    addonNames: ['Fabric stain protectant spray']
  },
  {
    name: 'Furnished apartment - Home deep cleaning',
    description: 'Full house top-to-bottom mechanized cleaning with floor scrubbing and kitchen degreasing.',
    price: 3499,
    duration: 225,
    image: 'photo-1581578731548-c64695cc6952',
    packageNames: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa', 'Balcony wash'],
    addonNames: ['Inside oven & chimney degrease']
  },
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
