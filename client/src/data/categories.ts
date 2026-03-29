import { 
  Wrench, Home, Palette, Tent, Trophy, Waves, 
  PartyPopper, UtensilsCrossed, Baby, Box, BookOpen 
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  isSpecial?: boolean;
}

export const categories: Category[] = [
  { id: "books", name: "Books", icon: BookOpen },
  { id: "tools", name: "Tools", icon: Wrench },
  { id: "home-diy", name: "Home & DIY", icon: Home },
  { id: "art-craft", name: "Art & Craft", icon: Palette },
  { id: "camping-outdoors", name: "Camping & Outdoors", icon: Tent },
  { id: "sports", name: "Sports Equipment", icon: Trophy },
  { id: "beach-surf", name: "Beach & Surf", icon: Waves },
  { id: "party-events", name: "Party & Events", icon: PartyPopper },
  { id: "kitchen", name: "Kitchen & Cooking", icon: UtensilsCrossed },
  { id: "kids", name: "Kids Gear", icon: Baby },
  { id: "misc", name: "Miscellaneous", icon: Box },
];

export const getCategoryById = (id: string) => categories.find(cat => cat.id === id);
export const getCategoryName = (id: string) => getCategoryById(id)?.name || id;
export const isSpecialCategory = (id: string) => getCategoryById(id)?.isSpecial ?? false;
