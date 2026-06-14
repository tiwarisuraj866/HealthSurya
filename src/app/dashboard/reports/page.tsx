"use client";

import { useState } from "react";
import { explainMedicalReport } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Activity,
  Plus,
  Loader2,
  AlertOctagon,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  UploadCloud
} from "lucide-react";

const DEMO_REPORTS = {
  cbc: {
    hemoglobin: "11.2",
    wbc: "12500",
    platelets: "230000"
  },
  thyroid: {
    tsh: "5.8",
    t3: "115",
    t4: "7.1"
  },
  diabetes: {
    fasting_sugar: "118",
    hba1c: "6.2"
  }
};

export default function MedicalReportExplainerPage() {
  const [reportType, setReportType] = useState<"cbc" | "thyroid" | "diabetes">("cbc");
  const [formData, setFormData] = useState<Record<string, string>>({
    hemoglobin: "",
    wbc: "",
    platelets: ""
  });
  
  const [analyzing, setAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleTypeChange = (type: "cbc" | "thyroid" | "diabetes") => {
    setReportType(type);
    setResult(null);
    if (type === "cbc") {
      setFormData({ hemoglobin: "", wbc: "", platelets: "" });
    } else if (type === "thyroid") {
      setFormData({ tsh: "", t3: "", t4: "" });
    } else {
      setFormData({ fasting_sugar: "", hba1c: "" });
    }
  };

  const loadDemo = (type: "cbc" | "thyroid" | "diabetes") => {
    setFormData(DEMO_REPORTS[type]);
    toast.success(`Loaded Demo ${type.toUpperCase()} Report Values!`);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setResult(null);

    // Simulate OCR scanner progress steps
    const steps = [
      "Simulating high-precision OCR extraction...",
      "Identifying report biomarkers and reference thresholds...",
      "Feeding markers into HealthSurya Clinical Reasoning Engine...",
      "Generating patient-friendly health translation..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgressText(steps[i]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    try {
      const res = await explainMedicalReport({
        reportType,
        data: formData
      });
      if (res.success) {
        setResult(res);
        toast.success("AI Explanation complete!");
      } else {
        toast.error("Failed to analyze report details");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze");
    } finally {
      setAnalyzing(false);
      setProgressText("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold font-sans sm:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <Activity className="h-8 w-8 text-primary shrink-0" /> AI Medical Report Explainer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand your clinical diagnostics. Upload lab reports and get immediate, simplified breakdowns of what your levels mean.
          </p>
        </div>
      </header>

      {/* Critical Medical Disclaimer Banner */}
      <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3 shadow-sm leading-normal">
        <AlertOctagon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-destructive uppercase tracking-wider">Clinical Notice & Disclaimer</h4>
          <p className="text-xs text-destructive/80 leading-relaxed font-medium">
            This AI tool provides educational, plain-English translations of lab results. It is **not** a doctor and does **not** provide official medical diagnoses, treatment courses, or prescriptions. Always share reports and consult directly with a qualified doctor.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Upload / Input panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-5 border rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-2">
              <UploadCloud className="h-4 w-4" /> Report Uploader
            </h3>
            
            {/* Report Type selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Report Category</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["cbc", "thyroid", "diabetes"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={reportType === t ? "default" : "outline"}
                    className="h-9 text-[10px] uppercase font-bold px-1 rounded-xl"
                    onClick={() => handleTypeChange(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Drag & Drop uploader simulator */}
            <div
              className="border-2 border-dashed border-border/80 rounded-xl p-5 text-center cursor-pointer hover:bg-muted/40 transition-colors flex flex-col items-center justify-center gap-2 group"
              onClick={() => loadDemo(reportType)}
            >
              <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors opacity-75" />
              <div className="text-[11px] font-bold text-foreground">Drag & drop report image / PDF</div>
              <span className="text-[9px] text-muted-foreground leading-none">Or click here to load demo test data</span>
            </div>

            {/* Form inputs */}
            <form onSubmit={handleAnalyze} className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Extracted Biometric Values
              </div>
              
              {reportType === "cbc" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="hb" className="text-xs">Hemoglobin (g/dL)</Label>
                    <Input
                      id="hb"
                      required
                      type="number"
                      step="0.1"
                      placeholder="e.g. 12.8"
                      value={formData.hemoglobin}
                      onChange={(e) => setFormData({ ...formData, hemoglobin: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wbc" className="text-xs">White Blood Cells (WBC/mcL)</Label>
                    <Input
                      id="wbc"
                      required
                      type="number"
                      placeholder="e.g. 6400"
                      value={formData.wbc}
                      onChange={(e) => setFormData({ ...formData, wbc: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plt" className="text-xs">Platelets (k/mcL)</Label>
                    <Input
                      id="plt"
                      required
                      type="number"
                      placeholder="e.g. 210000"
                      value={formData.platelets}
                      onChange={(e) => setFormData({ ...formData, platelets: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                </>
              )}

              {reportType === "thyroid" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="tsh" className="text-xs">TSH (uIU/mL)</Label>
                    <Input
                      id="tsh"
                      required
                      type="number"
                      step="0.01"
                      placeholder="e.g. 2.45"
                      value={formData.tsh}
                      onChange={(e) => setFormData({ ...formData, tsh: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="t3" className="text-xs">Total T3 (ng/dL)</Label>
                    <Input
                      id="t3"
                      required
                      type="number"
                      placeholder="e.g. 110"
                      value={formData.t3}
                      onChange={(e) => setFormData({ ...formData, t3: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="t4" className="text-xs">Total T4 (ug/dL)</Label>
                    <Input
                      id="t4"
                      required
                      type="number"
                      step="0.1"
                      placeholder="e.g. 7.5"
                      value={formData.t4}
                      onChange={(e) => setFormData({ ...formData, t4: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                </>
              )}

              {reportType === "diabetes" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="fbs" className="text-xs">Fasting Sugar (mg/dL)</Label>
                    <Input
                      id="fbs"
                      required
                      type="number"
                      placeholder="e.g. 96"
                      value={formData.fasting_sugar}
                      onChange={(e) => setFormData({ ...formData, fasting_sugar: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hba1c" className="text-xs">HbA1c (%)</Label>
                    <Input
                      id="hba1c"
                      required
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.6"
                      value={formData.hba1c}
                      onChange={(e) => setFormData({ ...formData, hba1c: e.target.value })}
                      className="glass text-xs h-9"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full btn-gradient min-h-10 text-xs font-semibold gap-1.5 pt-1.5" disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 text-emerald-200" />}
                Analyze report
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side: Analysis report logs */}
        <div className="lg:col-span-2 space-y-6">
          {analyzing && (
            <div className="glass-card rounded-2xl border p-12 text-center flex flex-col items-center justify-center gap-3 bg-card/45 min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <h4 className="font-bold text-sm text-foreground animate-pulse">{progressText}</h4>
              <p className="text-xs text-muted-foreground">Running digital parsing sequence...</p>
            </div>
          )}

          {!analyzing && !result && (
            <div className="glass-card rounded-2xl border p-12 text-center flex flex-col items-center justify-center gap-2 bg-card/15 min-h-[300px]">
              <Activity className="h-12 w-12 text-muted-foreground/30 animate-pulse" />
              <h3 className="font-bold font-sans text-sm sm:text-base">No Report Analyzed Yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Drag a file above or load test values to verify the AI&apos;s clinical interpretation.
              </p>
            </div>
          )}

          {!analyzing && result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Markers Table */}
              <div className="glass-card p-5 border rounded-2xl space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-2">
                  <TrendingUp className="h-4 w-4" /> Extracted Clinical Biomarkers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                        <th className="py-2.5">Biomarker</th>
                        <th className="py-2.5">Measured</th>
                        <th className="py-2.5">Normal Range</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {result.analysis?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="py-3 font-bold text-foreground">{item.marker}</td>
                          <td className="py-3 font-semibold">{item.value}</td>
                          <td className="py-3 text-muted-foreground">{item.range}</td>
                          <td className="py-3">
                            <Badge
                              className="font-bold uppercase tracking-wider text-[9px] py-0.5 px-2"
                              variant={
                                item.status === "normal"
                                  ? "default"
                                  : item.status === "high"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {item.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Explanation breakdown */}
              <div className="glass-card p-5 border rounded-2xl space-y-3 bg-gradient-to-b from-primary/5 to-transparent">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 border-b pb-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Patient-Friendly Translation
                </h3>
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line prose max-w-none dark:prose-invert">
                  {result.explanation}
                </div>

                {/* Marker detail notes list */}
                <div className="border-t pt-3 mt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Marker Insights:</span>
                  {result.analysis?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start text-xs bg-muted/40 p-2 rounded-xl">
                      {item.status !== "normal" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <strong className="text-foreground">{item.marker}:</strong> {item.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
