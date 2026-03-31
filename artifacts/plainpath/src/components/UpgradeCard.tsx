type Props = {
  title: string;
  description: string;
};

export default function UpgradeCard({ title, description }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
        {title}
      </h3>
      <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
        {description}
      </p>
      <a
        href="/#pricing"
        className="mt-4 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
      >
        View Plans
      </a>
    </div>
  );
}
