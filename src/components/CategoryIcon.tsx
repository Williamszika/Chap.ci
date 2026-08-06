import {
  Car,
  Home,
  Smartphone,
  Laptop,
  Sofa,
  Shirt,
  Briefcase,
  Wrench,
  HardHat,
  Sprout,
  Dumbbell,
  Baby,
  Apple,
  PawPrint,
  HeartPulse,
  Plane,
  Gift,
  Backpack,
  Package,
  type LucideProps,
} from 'lucide-react'

const map: Record<string, React.ComponentType<LucideProps>> = {
  Car,
  HeartPulse,
  Home,
  Smartphone,
  Laptop,
  Sofa,
  Shirt,
  Briefcase,
  Wrench,
  HardHat,
  Sprout,
  Dumbbell,
  Baby,
  Apple,
  PawPrint,
  Plane,
  Gift,
  Backpack,
}

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = map[name] ?? Package
  return <Cmp {...props} />
}
