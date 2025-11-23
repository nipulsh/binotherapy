"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Home, RotateCcw, Play, BarChart3, Loader2 } from "lucide-react";
import type { GameType } from "@/lib/types/game.types";

export interface RoundCompleteData {
  score: number;
  accuracy?: number;
  level?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface RoundCompleteModalProps {
  open: boolean;
  gameType: GameType;
  gameName: string;
  data: RoundCompleteData;
  onContinue?: () => void;
  onRestart?: () => void;
  onClose?: () => void;
}

export function RoundCompleteModal({
  open,
  gameType: _gameType,
  gameName: _gameName,
  data,
  onContinue,
  onRestart,
  onClose,
}: RoundCompleteModalProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "error">(
    "saving"
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveGameResult = async () => {
    setSaving(true);
    setSaveStatus("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/game/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_type: _gameType,
          game_name: _gameName,
          score: Math.round(data.score),
          accuracy:
            data.accuracy !== undefined && data.accuracy !== null
              ? Math.max(0, Math.min(100, data.accuracy))
              : null,
          duration: data.duration || null,
          level: data.level || null,
          metadata: data.metadata || {},
        }),
      });

      if (response.ok) {
        setSaveStatus("saved");
        // Trigger analysis recompute in background (don't wait)
        fetch("/api/analysis/compute-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }).catch(() => {
          // Silently fail - analysis will update on next view
        });
      } else {
        const errorData = await response.json();
        setSaveStatus("error");
        setSaveError(errorData.error || "Failed to save");
      }
    } catch (error) {
      console.error("Save game error:", error);
      setSaveStatus("error");
      setSaveError(
        error instanceof Error ? error.message : "Failed to save results"
      );
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when modal opens
  useEffect(() => {
    if (open && saveStatus === "saving") {
      saveGameResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saveStatus]);


  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else if (onRestart) {
      onRestart();
    }
    if (onClose) onClose();
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    }
    if (onClose) onClose();
  };

  const handleHome = () => {
    router.push("/dashboard");
  };

  const handleAnalysis = () => {
    router.push("/analysis");
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md border-2 border-purple-500/30 bg-gradient-to-br from-gray-900/98 via-purple-900/98 to-gray-900/98 backdrop-blur-sm"
        style={{
          boxShadow: "0 8px 32px rgba(168, 85, 247, 0.4)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">
            <Trophy className="h-6 w-6 text-yellow-400" />
            Round Complete!
          </DialogTitle>
          <DialogDescription className="text-purple-200">
            Great job! Your results are being saved...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats Display */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-purple-300 mb-1">Score</div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(data.score)}
                </div>
              </div>
              {data.accuracy !== undefined && (
                <div>
                  <div className="text-xs text-purple-300 mb-1">Accuracy</div>
                  <div className="text-2xl font-bold text-white">
                    {data.accuracy}%
                  </div>
                </div>
              )}
              {data.level && (
                <div>
                  <div className="text-xs text-purple-300 mb-1">Level</div>
                  <div className="text-2xl font-bold text-white">
                    {data.level}
                  </div>
                </div>
              )}
              {data.duration && (
                <div>
                  <div className="text-xs text-purple-300 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-white">
                    {data.duration}s
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Status */}
          <div className="text-center">
            {saving && saveStatus === "saving" && (
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Saving results...</span>
              </div>
            )}
            {!saving && saveStatus === "saved" && (
              <div className="flex items-center justify-center gap-2 text-green-400">
                <span className="text-sm font-medium">✓ Results saved!</span>
              </div>
            )}
            {!saving && saveStatus === "error" && (
              <div className="flex items-center justify-center gap-2 text-red-400">
                <span className="text-sm font-medium">
                  ⚠ Save failed: {saveError || "Unknown error"}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              onClick={handleContinue}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
            >
              <Play className="h-4 w-4 mr-2" />
              Continue
            </Button>
            <Button
              onClick={handleRestart}
              disabled={saving}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 font-bold"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
            <Button
              onClick={handleHome}
              disabled={saving}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 font-bold"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              onClick={handleAnalysis}
              disabled={saving}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 font-bold"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analysis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

