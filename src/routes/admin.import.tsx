import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  startImport,
  getImportJob,
  publishProduct,
  archiveProduct,
  listDraftProducts,
} from "@/lib/import-product.functions";
import { AdminGate } from "@/components/AdminGate";

export const Route = createFileRoute("/admin/import")({
  component: () => (
    <AdminGate>
      <AdminImportPage />
    </AdminGate>
  ),
  head: () => ({
    meta: [{ title: "Import product" }, { name: "robots", content: "noindex" }],
  }),
});

const STEP_ORDER = ["scraping", "cleaning_images", "creating_listing", "ready"] as const;
const STEP_LABELS: Record<string, string> = {
  queued: "Importing product",
  scraping: "Importing product",
  cleaning_images: "Cleaning images",
  creating_listing: "Creating listing",
  ready: "Ready to publish",
  failed: "Failed",
};

function AdminImportPage() {
  const start = useServerFn(startImport);
  const fetchJob = useServerFn(getImportJob);
  const fetchDrafts = useServerFn(listDraftProducts);
  const publish = useServerFn(publishProduct);
  const archive = useServerFn(archiveProduct);
  const qc = useQueryClient();

  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const startMut = useMutation({
    mutationFn: async (u: string) => start({ data: { url: u } }),
    onSuccess: (r) => setJobId(r.jobId),
  });

  const jobQuery = useQuery({
    queryKey: ["import-job", jobId],
    queryFn: () => fetchJob({ data: { jobId: jobId! } }),
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.job?.status;
      return s === "ready" || s === "failed" ? false : 800;
    },
  });

  const draftsQuery = useQuery({
    queryKey: ["draft-products"],
    queryFn: () => fetchDrafts(),
    refetchInterval: 5_000,
  });

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    startMut.mutate(url.trim());
  };

  const handlePublish = async (id: string) => {
    await publish({ data: { productId: id } });
    qc.invalidateQueries({ queryKey: ["draft-products"] });
    setJobId(null);
  };
  const handleArchive = async (id: string) => {
    await archive({ data: { productId: id } });
    qc.invalidateQueries({ queryKey: ["draft-products"] });
  };

  const job = jobQuery.data?.job;
  const product = jobQuery.data?.product;
  const images = jobQuery.data?.images ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl tracking-luxe uppercase mb-2">Import product</h1>
      <p className="text-sm text-foreground/70 mb-8">
        Paste a Vestiaire Collective listing URL. The system fetches details, cleans
        each photo (white background, square 1600×1600), and creates a draft listing
        for you to review.
      </p>

      <form onSubmit={handleStart} className="flex gap-3 mb-10">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.vestiairecollective.com/..."
          className="flex-1 rounded-full border border-foreground/15 bg-background px-5 py-3 text-sm"
          disabled={startMut.isPending || (job ? job.status !== "ready" && job.status !== "failed" : false)}
        />
        <button
          type="submit"
          disabled={startMut.isPending}
          className="rounded-full bg-foreground px-6 py-3 text-xs uppercase tracking-luxe text-background disabled:opacity-50"
        >
          {startMut.isPending ? "Starting…" : "Import"}
        </button>
      </form>

      {startMut.error && (
        <p className="mb-6 text-sm text-red-600">{String(startMut.error)}</p>
      )}

      {job && (
        <div className="mb-12 rounded-2xl border border-foreground/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs tracking-luxe uppercase text-foreground/60">Job status</p>
            <p className="text-xs text-foreground/50 font-mono">{job.id.slice(0, 8)}</p>
          </div>

          <div className="space-y-2 mb-4">
            {STEP_ORDER.map((step) => {
              const currentIndex = STEP_ORDER.indexOf(job.status as typeof STEP_ORDER[number]);
              const stepIndex = STEP_ORDER.indexOf(step);
              const failed = job.status === "failed";
              const active = !failed && stepIndex === currentIndex;
              const done = !failed && stepIndex < currentIndex;
              return (
                <div key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[10px] ${
                      done
                        ? "bg-foreground text-background"
                        : active
                        ? "bg-primary text-primary-foreground animate-pulse"
                        : failed && stepIndex === currentIndex
                        ? "bg-red-500 text-white"
                        : "bg-foreground/10 text-foreground/40"
                    }`}
                  >
                    {done ? "✓" : stepIndex + 1}
                  </span>
                  <span className={done || active ? "text-foreground" : "text-foreground/40"}>
                    {STEP_LABELS[step]}
                  </span>
                  {active && job.progress_total > 0 && (
                    <span className="text-xs text-foreground/50">
                      {job.progress_current}/{job.progress_total}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {job.status === "failed" && (
            <p className="text-sm text-red-600">{job.error}</p>
          )}

          {product && (
            <div className="mt-6 border-t border-foreground/10 pt-6">
              <p className="text-xs tracking-luxe uppercase text-foreground/60 mb-1">
                {product.house}
              </p>
              <h2 className="text-lg mb-2">{product.name}</h2>
              <p className="text-sm text-foreground/70 mb-4">
                ${product.price.toLocaleString()} · {product.category}
                {product.size ? ` · ${product.size}` : ""}
                {product.condition ? ` · ${product.condition}` : ""}
              </p>
              {product.needs_image_review && (
                <p className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">
                  Needs image review
                </p>
              )}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-white border border-foreground/10"
                  >
                    <img
                      src={img.processed_url}
                      alt=""
                      className="absolute inset-0 size-full object-contain"
                    />
                    {img.needs_review && (
                      <span className="absolute top-1 right-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] text-white">
                        Review
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {job.status === "ready" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePublish(product.id)}
                    className="rounded-full bg-foreground px-5 py-2 text-xs uppercase tracking-luxe text-background"
                  >
                    Publish to site
                  </button>
                  <button
                    onClick={() => handleArchive(product.id)}
                    className="rounded-full border border-foreground/15 px-5 py-2 text-xs uppercase tracking-luxe"
                  >
                    Archive
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <section>
        <h2 className="text-sm tracking-luxe uppercase text-foreground/60 mb-4">
          Pending drafts ({draftsQuery.data?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {(draftsQuery.data ?? []).map((p: any) => (
            <div
              key={p.id}
              className="flex items-center gap-4 rounded-xl border border-foreground/10 p-3"
            >
              <div className="size-16 shrink-0 rounded-md overflow-hidden bg-white">
                {p.images?.[0]?.processed_url && (
                  <img
                    src={p.images[0].processed_url}
                    alt=""
                    className="size-full object-contain"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-luxe text-foreground/60">{p.house}</p>
                <p className="truncate text-sm">{p.name}</p>
                <p className="text-xs text-foreground/50">
                  ${p.price.toLocaleString()} · {p.images?.length ?? 0} images
                  {p.needs_image_review ? " · needs review" : ""}
                </p>
              </div>
              <button
                onClick={() => handlePublish(p.id)}
                className="rounded-full bg-foreground px-4 py-1.5 text-[10px] uppercase tracking-luxe text-background"
              >
                Publish
              </button>
              <button
                onClick={() => handleArchive(p.id)}
                className="rounded-full border border-foreground/15 px-4 py-1.5 text-[10px] uppercase tracking-luxe"
              >
                Archive
              </button>
            </div>
          ))}
          {draftsQuery.data?.length === 0 && (
            <p className="text-sm text-foreground/50">No drafts pending.</p>
          )}
        </div>
      </section>
    </div>
  );
}
