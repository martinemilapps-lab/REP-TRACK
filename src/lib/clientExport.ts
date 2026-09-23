/**
 * Universal client-side export utility for REP TRACK.
 * Ensures reliable Excel (.xlsx) file downloads across all modern browsers:
 * - Proper UTF-8 filename decoding from Content-Disposition (RFC 5987 / RFC 6266).
 * - Automatic blob URL lifecycle management (clean revocation).
 * - Graceful error extraction and notification if API returns an error response.
 * - Prevents blank popup tabs and popup-blocker triggers.
 */

export async function downloadExcelFromUrl(url: string, fallbackFilename = 'REP_TRACK_Export.xlsx'): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream',
    },
  });

  if (!response.ok) {
    let errorMessage = `Export failed with HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && (errorJson.message || errorJson.error)) {
        errorMessage = errorJson.message || errorJson.error;
      }
    } catch {
      try {
        const text = await response.text();
        if (text && text.length < 200) errorMessage = text;
      } catch {}
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition');
  let filename = fallbackFilename;

  if (disposition) {
    // 1. Try RFC 5987 syntax: filename*=UTF-8''...
    const starMatch = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
    if (starMatch?.[1]) {
      try {
        filename = decodeURIComponent(starMatch[1].trim().replace(/^["']|["']$/g, ''));
      } catch {
        filename = starMatch[1].trim();
      }
    } else {
      // 2. Fall back to standard filename="..."
      const standardMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (standardMatch?.[1]) {
        filename = standardMatch[1].trim();
      }
    }
  }

  // Ensure .xlsx extension if missing
  if (!filename.toLowerCase().endsWith('.xlsx') && !filename.toLowerCase().endsWith('.csv')) {
    filename = `${filename}.xlsx`;
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();

  // Clean up object URL after download trigger
  setTimeout(() => {
    try {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch {}
  }, 500);

  return filename;
}
