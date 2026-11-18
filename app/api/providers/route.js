import { handler, json } from '@/lib/api';
import { User, ProviderProfile, Package } from '@/lib/models';

export const dynamic = 'force-dynamic';

// Public list of approved dieticians / nutritionists
export const GET = handler(async () => {
  const users = await User.find({ role: 'provider', status: 'approved' }).select('name').lean();
  const ids = users.map((u) => u._id);
  const [profiles, pkgs] = await Promise.all([
    ProviderProfile.find({ user: { $in: ids } }).lean(),
    Package.find({ provider: { $in: ids }, active: true }).select('provider price').lean(),
  ]);

  const providers = users.map((u) => {
    const p = profiles.find((x) => String(x.user) === String(u._id)) || {};
    const prices = pkgs.filter((k) => String(k.provider) === String(u._id)).map((k) => k.price);
    return {
      id: u._id,
      name: u.name,
      providerType: p.providerType || 'Dietician',
      headline: p.headline || '',
      experienceYears: p.experienceYears || 0,
      specializations: p.specializations || [],
      languages: p.languages || [],
      ratingAvg: p.ratingAvg || 0,
      ratingCount: p.ratingCount || 0,
      startingPrice: prices.length ? Math.min(...prices) : null,
      packageCount: prices.length,
    };
  });

  return json({ providers });
});
