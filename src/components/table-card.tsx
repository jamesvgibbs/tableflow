"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, AlertTriangle, Users, CheckCircle2, QrCode, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Guest } from "@/lib/types";
import { detectDepartmentClustering } from "@/lib/assignments";
import { downloadQrCode } from "@/lib/qr-download";
import { cn } from "@/lib/utils";
import { ThemeColors } from "@/lib/theme-presets";

// WCAG contrast calculation
function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;
  const [r, g, b] = [1, 2, 3].map((i) => {
    const c = parseInt(result[i], 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getAccessibleTextColor(background: string): string {
  const blackRatio = getContrastRatio(background, "#000000");
  const whiteRatio = getContrastRatio(background, "#FFFFFF");
  return blackRatio > whiteRatio ? "#000000" : "#FFFFFF";
}

function getAccessibleMutedColor(background: string): string {
  const bgLuminance = getLuminance(background);
  return bgLuminance > 0.5 ? "#666666" : "#999999";
}

export interface TableCardProps {
  tableNumber: number;
  guests: Guest[];
  qrCodeId: string;
  eventName: string;
  baseUrl: string;
  onDownload?: () => void;
  themeColors?: ThemeColors;
}

export function TableCard({
  tableNumber,
  guests,
  qrCodeId,
  eventName,
  baseUrl,
  onDownload,
  themeColors,
}: TableCardProps) {
  const [showQr, setShowQr] = useState(false);
  const [isDownloadHovered, setIsDownloadHovered] = useState(false);
  const qrUrl = `${baseUrl}/scan/${qrCodeId}`;
  const checkedInCount = guests.filter((g) => g.checkedIn).length;
  const checkInPercent = guests.length > 0 ? (checkedInCount / guests.length) * 100 : 0;
  const isFullyCheckedIn = checkedInCount === guests.length && guests.length > 0;

  // Sort guests: waiting first, then checked in
  const sortedGuests = [...guests].sort((a, b) => {
    if (a.checkedIn === b.checkedIn) return 0;
    return a.checkedIn ? 1 : -1;
  });

  const { hasClustering, clusters } = detectDepartmentClustering({
    tableNumber,
    guests,
    qrCodeId,
  });

  const handleDownload = async () => {
    await downloadQrCode({
      type: "table",
      qrCodeId,
      eventName,
      tableNumber,
      guestCount: guests.length,
      baseUrl,
    });

    onDownload?.();
  };

  // Get unique departments for visual summary
  const departmentCounts = guests.reduce(
    (acc, guest) => {
      if (guest.department) {
        acc[guest.department] = (acc[guest.department] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Theme-aware styles
  const cardBg = themeColors?.secondary;
  const cardText = themeColors ? getAccessibleTextColor(themeColors.secondary) : undefined;
  const cardTextMuted = themeColors ? getAccessibleMutedColor(themeColors.secondary) : undefined;
  const accentBg = themeColors?.accent;
  const accentText = themeColors ? getAccessibleTextColor(themeColors.accent) : undefined;
  const primaryBg = themeColors?.primary;
  const primaryText = themeColors ? getAccessibleTextColor(themeColors.primary) : undefined;
  const mutedBg = themeColors?.muted;
  const successColor = themeColors ? themeColors.primary : "#22c55e";

  return (
    <Card
      className={cn(
        "w-full max-w-md overflow-hidden transition-all duration-200 hover:shadow-lg",
        isFullyCheckedIn && !themeColors && "ring-2 ring-green-500"
      )}
      style={themeColors ? {
        backgroundColor: cardBg,
        borderColor: `${themeColors.muted}60`,
        ...(isFullyCheckedIn ? { boxShadow: `0 0 0 2px ${successColor}` } : {}),
      } : undefined}
    >
      {/* Progress bar at top */}
      <div
        className={cn("h-1.5", !themeColors && "bg-muted")}
        style={themeColors ? { backgroundColor: `${cardTextMuted}30` } : undefined}
      >
        <div
          className={cn(
            "h-full transition-all duration-500",
            !themeColors && (isFullyCheckedIn ? "bg-green-500" : "bg-primary")
          )}
          style={{
            width: `${checkInPercent}%`,
            backgroundColor: themeColors ? successColor : undefined,
          }}
        />
      </div>
      {/* Header with table number */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Table number - prominent display */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shadow-md",
                !themeColors && "bg-gradient-to-br from-primary to-primary/80"
              )}
              style={themeColors ? { backgroundColor: primaryBg } : undefined}
            >
              <span
                className={cn("text-2xl font-bold", !themeColors && "text-primary-foreground")}
                style={themeColors ? { color: primaryText } : undefined}
              >
                {tableNumber}
              </span>
            </div>
            <div>
              <h3
                className={cn("text-xl font-semibold", !themeColors && "text-foreground")}
                style={themeColors ? { color: cardText } : undefined}
              >
                Table {tableNumber}
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={cn("flex items-center gap-1.5", !themeColors && "text-muted-foreground")}
                  style={themeColors ? { color: cardTextMuted } : undefined}
                >
                  <Users className="size-3.5" />
                  {guests.length} guest{guests.length !== 1 ? "s" : ""}
                </span>
                <span
                  className={cn("flex items-center gap-1.5 font-semibold", !themeColors && "text-green-600")}
                  style={themeColors ? { color: successColor } : undefined}
                >
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                  {guests.filter((g) => g.checkedIn).length}/{guests.length} in
                </span>
              </div>
            </div>
          </div>

          {/* Clustering warning */}
          {hasClustering && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn("p-2 rounded-full", !themeColors && "bg-amber-100 text-amber-600")}
                  style={themeColors ? {
                    backgroundColor: `${themeColors.accent}30`,
                    color: accentText === "#000000" ? themeColors.accent : cardText,
                  } : undefined}
                >
                  <AlertTriangle className="size-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">
                    Department clustering detected:
                  </p>
                  {clusters.map((cluster) => (
                    <p key={cluster.department}>
                      {cluster.department}: {cluster.count} guests
                    </p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Department summary pills - use theme accent color */}
        {Object.keys(departmentCounts).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {Object.entries(departmentCounts).map(([dept, count]) => (
              <span
                key={dept}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={themeColors ? {
                  backgroundColor: `${accentBg}20`,
                  color: cardText,
                  border: `1px solid ${accentBg}40`,
                } : {
                  backgroundColor: `${accentBg || 'hsl(var(--accent))'}20`,
                  color: 'hsl(var(--foreground))',
                  border: `1px solid ${accentBg || 'hsl(var(--accent))'}40`,
                }}
              >
                {dept} ({count})
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Guest List */}
        <div className="space-y-2">
          <h4
            className={cn("text-xs font-medium uppercase tracking-wider", !themeColors && "text-muted-foreground")}
            style={themeColors ? { color: cardTextMuted } : undefined}
          >
            Guests at this table
          </h4>
          <div className="space-y-1.5">
            {sortedGuests.map((guest) => (
              <div
                key={guest.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-md transition-colors",
                  !themeColors && "bg-muted/50 hover:bg-muted"
                )}
                style={themeColors ? {
                  backgroundColor: `${mutedBg}50`,
                } : undefined}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {guest.checkedIn ? (
                    <CheckCircle2
                      className="size-5 shrink-0"
                      strokeWidth={2.5}
                      style={{ color: successColor }}
                    />
                  ) : (
                    <div
                      className="size-4 rounded-full border-2 shrink-0"
                      style={themeColors ? { borderColor: `${cardTextMuted}50` } : { borderColor: 'hsl(var(--muted-foreground) / 0.3)' }}
                    />
                  )}
                  <span
                    className={cn("text-sm font-medium truncate", !themeColors && "text-foreground")}
                    style={themeColors ? { color: cardText } : undefined}
                  >
                    {guest.name}
                  </span>
                </div>
                {guest.department && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium shrink-0 ml-2"
                    style={themeColors ? {
                      backgroundColor: `${accentBg}20`,
                      color: cardText,
                      border: `1px solid ${accentBg}40`,
                    } : {
                      backgroundColor: 'hsl(var(--accent) / 0.2)',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--accent) / 0.4)',
                    }}
                  >
                    {guest.department}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible QR Section */}
        <div
          className="pt-2 border-t"
          style={themeColors ? { borderColor: `${cardTextMuted}30` } : undefined}
        >
          <button
            onClick={() => setShowQr(!showQr)}
            className="w-full flex items-center justify-between text-sm transition-colors py-2"
            style={themeColors ? { color: cardTextMuted } : undefined}
          >
            <span className="flex items-center gap-2">
              <QrCode className="size-4" />
              {showQr ? "Hide QR Code" : "Show QR Code"}
            </span>
            {showQr ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {/* Collapsible QR code */}
          <div className={cn(
            "grid transition-all duration-300 ease-in-out",
            showQr ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
          )}>
            <div className="overflow-hidden">
              <div className="flex justify-center mb-3">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button - always visible */}
        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full transition-colors"
          style={themeColors ? {
            backgroundColor: isDownloadHovered ? `${cardText}10` : 'transparent',
            color: cardText,
            borderColor: `${cardText}40`,
          } : undefined}
          onMouseEnter={() => setIsDownloadHovered(true)}
          onMouseLeave={() => setIsDownloadHovered(false)}
        >
          <Download className="size-4" />
          Download Table Card
        </Button>
      </CardContent>
    </Card>
  );
}
