import { HomeShowcaseRail } from "./HomeShowcaseRail";

export function HomeServicesSection({ city }: { city: string }) {
  return (
    <section className="page-wrap py-6 sm:py-8">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Explore nearby care</h2>
          <p className="text-sm text-muted-foreground">
            Services, doctors &amp; labs in {city.trim() || "your city"} — swipe or use arrows.
          </p>
        </div>
      </div>
      <HomeShowcaseRail city={city} />
    </section>
  );
}
