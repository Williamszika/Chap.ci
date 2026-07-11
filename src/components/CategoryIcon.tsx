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
  Package,
  type LucideProps,
} from 'lucide-react'

const map: Record<string, React.ComponentType<LucideProps>> = {
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
}

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = map[name] ?? Package
  return <Cmp {...props} />
}
