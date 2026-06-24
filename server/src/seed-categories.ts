import prisma from './config/prisma';

const INTERESTS = [
  ["Startups", "#ff6b4a"], ["Design", "#6d5efc"], ["Technology", "#2a7fff"], ["Music", "#e5489d"],
  ["Art & Culture", "#f59e0b"], ["Wellness", "#10b981"], ["Food & Drink", "#ef6f53"], ["Networking", "#8b5cf6"],
  ["Investing", "#0ea5a4"], ["Travel", "#3b82f6"], ["Gaming", "#a855f7"], ["Film & Media", "#f43f5e"],
  ["Writing", "#64748b"], ["Sustainability", "#22c55e"], ["Sports", "#f97316"], ["Photography", "#06b6d4"],
];

async function seed() {
  for (const [name, col] of INTERESTS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.categories.upsert({
      where: { slug },
      update: { name, kind: col },
      create: { slug, name, kind: col }
    });
  }
  console.log("Seeded full interests!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
