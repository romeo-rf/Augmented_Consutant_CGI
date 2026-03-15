import type {
  ClientRadar,
  ContactProfile,
  OfferingMatch,
  SmartQuestion,
  AlertItem,
} from "./types";
import type { MeetingContext } from "@/lib/types/meeting";

/**
 * Génère le HTML du brief pour l'export PDF via window.print()
 */
export function generateBriefHTML(params: {
  meetingContext: MeetingContext;
  clientRadar: ClientRadar | null;
  contactProfile: ContactProfile | null;
  offeringsMapping: OfferingMatch[];
  questions: SmartQuestion[];
  alerts: AlertItem[];
  generationTime?: number;
  radarBookmarks?: Set<string>;
}): string {
  const { meetingContext, clientRadar, contactProfile, offeringsMapping, questions, alerts, generationTime, radarBookmarks } = params;

  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const phaseOrder = ["ouverture", "decouverte", "approfondissement", "conclusion"] as const;
  const phaseLabels: Record<string, string> = {
    ouverture: "Ouverture",
    decouverte: "Découverte",
    approfondissement: "Approfondissement",
    conclusion: "Conclusion",
  };

  const severityLabels: Record<string, string> = {
    info: "ℹ️ Info",
    warning: "⚠️ Attention",
    critical: "🚨 Critique",
  };

  const typeLabels: Record<string, string> = {
    sensible: "Sujet sensible",
    concurrent: "Concurrent",
    objection: "Objection probable",
    opportunite: "Opportunité",
  };

  const now = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Brief - ${meetingContext.companyName || "Préparation RDV"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }

    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #e31937; padding-bottom: 16px; margin-bottom: 32px; }
    .header h1 { font-size: 24px; color: #e31937; }
    .header .meta { text-align: right; font-size: 12px; color: #666; }
    .header .logo { font-weight: 800; font-size: 20px; color: #e31937; }

    .context-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .context-item { font-size: 13px; }
    .context-label { font-weight: 600; color: #333; }
    .context-value { color: #666; }

    h2 { font-size: 18px; color: #e31937; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #eee; }
    h3 { font-size: 14px; color: #333; margin: 12px 0 8px; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-sector { background: #e8e8e8; color: #333; }
    .badge-score-high { background: #dcfce7; color: #166534; }
    .badge-score-mid { background: #fef3c7; color: #92400e; }
    .badge-score-low { background: #f3f4f6; color: #374151; }

    .fact-list { list-style: none; padding: 0; }
    .fact-list li { padding: 4px 0; font-size: 13px; padding-left: 16px; position: relative; }
    .fact-list li::before { content: "•"; color: #e31937; position: absolute; left: 0; font-weight: bold; }

    .news-item { border-left: 3px solid #e31937; padding: 8px 12px; margin: 8px 0; background: #fafafa; }
    .news-item .headline { font-size: 13px; font-weight: 500; }
    .news-item .date { font-size: 11px; color: #888; }
    .news-item .source { font-size: 11px; color: #e31937; }

    .offering-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 8px 0; }
    .offering-issue { font-size: 13px; font-weight: 600; }
    .offering-desc { font-size: 12px; color: #666; }
    .offering-name { font-size: 12px; color: #e31937; font-weight: 600; }
    .offering-reason { font-size: 12px; color: #888; font-style: italic; }

    .question-phase { margin: 16px 0 8px; }
    .phase-label { font-weight: 600; font-size: 13px; }
    .phase-ouverture { color: #2563eb; }
    .phase-decouverte { color: #7c3aed; }
    .phase-approfondissement { color: #d97706; }
    .phase-conclusion { color: #059669; }

    .question-item { border-left: 3px solid #ddd; padding: 6px 12px; margin: 6px 0; }
    .question-item.ouverture { border-color: #2563eb; }
    .question-item.decouverte { border-color: #7c3aed; }
    .question-item.approfondissement { border-color: #d97706; }
    .question-item.conclusion { border-color: #059669; }
    .question-text { font-size: 13px; font-weight: 500; }
    .question-intent { font-size: 11px; color: #888; margin-top: 2px; }

    .alert-item { border-left: 4px solid; border-radius: 0 8px 8px 0; padding: 10px 12px; margin: 8px 0; }
    .alert-info { border-color: #3b82f6; background: #eff6ff; }
    .alert-warning { border-color: #f59e0b; background: #fffbeb; }
    .alert-critical { border-color: #ef4444; background: #fef2f2; }
    .alert-title { font-size: 13px; font-weight: 600; }
    .alert-desc { font-size: 12px; color: #666; margin-top: 4px; }
    .alert-type { font-size: 11px; color: #888; }

    .sources { margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
    .sources a { font-size: 11px; color: #e31937; text-decoration: none; margin-right: 12px; }
    .sources a:hover { text-decoration: underline; }

    .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e31937; text-align: center; font-size: 11px; color: #888; }
    .time-saved { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 8px; text-align: center; margin: 24px 0; font-size: 13px; }

    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">CGI</div>
      <h1>Brief de préparation</h1>
    </div>
    <div class="meta">
      <div>Généré le ${now}</div>
      <div>Consultant Augmenté CGI</div>
    </div>
  </div>

  <div class="context-box">
    ${meetingContext.companyName ? `<div class="context-item"><span class="context-label">Entreprise :</span> <span class="context-value">${esc(meetingContext.companyName)}</span></div>` : ""}
    ${meetingContext.sector ? `<div class="context-item"><span class="context-label">Secteur :</span> <span class="context-value">${esc(meetingContext.sector)}</span></div>` : ""}
    ${meetingContext.contactName ? `<div class="context-item"><span class="context-label">Interlocuteur :</span> <span class="context-value">${esc(meetingContext.contactName)}${meetingContext.contactRole ? ` (${esc(meetingContext.contactRole)})` : ""}</span></div>` : ""}
    ${meetingContext.meetingType ? `<div class="context-item"><span class="context-label">Type de RDV :</span> <span class="context-value">${esc(meetingContext.meetingType)}</span></div>` : ""}
    ${meetingContext.cgiOffering ? `<div class="context-item"><span class="context-label">Offre CGI :</span> <span class="context-value">${esc(meetingContext.cgiOffering)}</span></div>` : ""}
  </div>

  ${generationTime ? `<div class="time-saved">⚡ Brief généré en ${Math.round(generationTime)}s — estimation manuelle : ~45 min</div>` : ""}

  ${clientRadar ? `
  <h2>🏢 Radar Client — ${esc(clientRadar.companyName)}</h2>

  ${(() => {
    const bookmarkedItems: string[] = [];
    if (radarBookmarks && radarBookmarks.size > 0) {
      clientRadar.keyNumbers.forEach((num, i) => { if (radarBookmarks.has(`keynum-${i}`)) bookmarkedItems.push(num); });
      clientRadar.keyFacts.forEach((fact, i) => { if (radarBookmarks.has(`fact-${i}`)) bookmarkedItems.push(fact); });
      clientRadar.recentNews.forEach((news, i) => { if (radarBookmarks.has(`news-${i}`)) bookmarkedItems.push(news.headline); });
      clientRadar.strategicIssues.forEach((issue, i) => { if (radarBookmarks.has(`issue-${i}`)) bookmarkedItems.push(issue.title); });
    }
    return bookmarkedItems.length > 0 ? `
  <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px;margin:12px 0;">
    <h3 style="color:#e31937;margin:0 0 8px;">📌 Mes points clés</h3>
    <ul class="fact-list">${bookmarkedItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
  </div>` : "";
  })()}

  <h3>Carte d'identité</h3>
  <table style="width:100%;font-size:13px;border-collapse:collapse;">
    <tr><td style="padding:4px 8px;font-weight:600;width:140px;">Secteur</td><td style="padding:4px 8px;">${esc(clientRadar.sector)}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Activité</td><td style="padding:4px 8px;">${clientRadar.activity ? esc(clientRadar.activity) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Taille</td><td style="padding:4px 8px;">${clientRadar.size ? esc(clientRadar.size) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Effectif</td><td style="padding:4px 8px;">${clientRadar.employeeCount ? esc(clientRadar.employeeCount) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">CA</td><td style="padding:4px 8px;">${clientRadar.revenue ? esc(clientRadar.revenue) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Siège</td><td style="padding:4px 8px;">${clientRadar.headquarters ? esc(clientRadar.headquarters) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Présence</td><td style="padding:4px 8px;">${clientRadar.geographicPresence ? esc(clientRadar.geographicPresence) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Clients</td><td style="padding:4px 8px;">${clientRadar.mainClients.length > 0 ? esc(clientRadar.mainClients.join(", ")) : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:600;">Tendance</td><td style="padding:4px 8px;">${clientRadar.financialTrend.direction !== "unknown" ? `${clientRadar.financialTrend.direction === "growth" ? "📈" : clientRadar.financialTrend.direction === "decline" ? "📉" : "➡️"} ${esc(clientRadar.financialTrend.details || clientRadar.financialTrend.direction)}` : '<em style="color:#d97706;">Non trouvé</em>'}</td></tr>
  </table>

  <h3>Chiffres clés</h3>
  ${clientRadar.keyNumbers.length > 0 ? `
  <ul class="fact-list">
    ${clientRadar.keyNumbers.map((n) => `<li><strong>${esc(n)}</strong></li>`).join("")}
  </ul>` : '<p style="font-size:12px;color:#d97706;font-style:italic;">Aucun chiffre clé trouvé</p>'}

  <h3>Accroche suggérée</h3>
  ${clientRadar.elevatorPitch ? `
  <div style="background:#f0f9ff;border-left:3px solid #e31937;padding:10px 14px;margin:12px 0;font-style:italic;font-size:13px;">
    💬 "${esc(clientRadar.elevatorPitch)}"
  </div>` : '<p style="font-size:12px;color:#d97706;font-style:italic;">Pas assez d\'informations pour générer une accroche</p>'}

  <h3>Enjeux stratégiques</h3>
  ${clientRadar.strategicIssues.length > 0 ? clientRadar.strategicIssues.map((issue) => `
  <div style="margin:6px 0;font-size:13px;">
    <span class="badge badge-sector">${esc(issue.category)}</span>
    <strong style="margin-left:4px;">${esc(issue.title)}</strong>
    <div style="font-size:12px;color:#666;padding-left:4px;">${esc(issue.description)}</div>
  </div>`).join("") : '<p style="font-size:12px;color:#d97706;font-style:italic;">Aucun enjeu identifié</p>'}

  <h3>Écosystème</h3>
  <p style="font-size:12px;"><strong>Position :</strong> ${clientRadar.ecosystem.marketPosition && clientRadar.ecosystem.marketPosition !== "Non déterminé" ? esc(clientRadar.ecosystem.marketPosition) : '<em style="color:#d97706;">Non trouvé</em>'}</p>
  <p style="font-size:12px;"><strong>Concurrents :</strong> ${clientRadar.ecosystem.competitors.length > 0 ? esc(clientRadar.ecosystem.competitors.join(", ")) : '<em style="color:#d97706;">Non trouvé</em>'}</p>
  <p style="font-size:12px;"><strong>Partenaires :</strong> ${clientRadar.ecosystem.knownPartners.length > 0 ? esc(clientRadar.ecosystem.knownPartners.join(", ")) : '<em style="color:#d97706;">Non trouvé</em>'}</p>

  <h3>Maturité digitale</h3>
  <p style="font-size:12px;"><strong>Niveau :</strong> ${clientRadar.digitalMaturity.level !== "inconnue" ? (clientRadar.digitalMaturity.level === "avancee" ? "Avancée" : clientRadar.digitalMaturity.level === "en_cours" ? "En cours" : "Émergente") : '<em style="color:#d97706;">Non déterminé</em>'}</p>
  ${clientRadar.digitalMaturity.signals.length > 0 ? `
  <ul class="fact-list">
    ${clientRadar.digitalMaturity.signals.map((s) => `<li>${esc(s)}</li>`).join("")}
  </ul>` : '<p style="font-size:12px;color:#d97706;font-style:italic;">Aucun signal identifié</p>'}

  <h3>Actualités récentes</h3>
  ${clientRadar.recentNews.length > 0 ? clientRadar.recentNews.map((n) => `
  <div class="news-item">
    <div class="headline">${esc(n.headline)}</div>
    ${n.businessSignal ? `<div style="font-size:11px;color:#2563eb;font-style:italic;">→ ${esc(n.businessSignal)}</div>` : ""}
    <span class="date">${esc(n.date)}</span>
    ${n.source ? ` — <a class="source" href="${esc(n.source.url)}">${esc(n.source.title)}</a>` : ""}
  </div>`).join("") : '<p style="font-size:12px;color:#d97706;font-style:italic;">Aucune actualité trouvée</p>'}

  ${clientRadar.keyFacts.length > 0 ? `
  <h3>Faits clés</h3>
  <ul class="fact-list">
    ${clientRadar.keyFacts.map((f) => `<li>${esc(f)}</li>`).join("")}
  </ul>` : ""}

  ${clientRadar.sources.length > 0 ? `
  <div class="sources">${clientRadar.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join("")}</div>` : ""}
  ` : ""}

  ${contactProfile ? `
  <h2>👤 Profil Interlocuteur — ${esc(contactProfile.name)}</h2>
  <p style="font-size:13px;color:#666;">${esc(contactProfile.role)}${contactProfile.linkedinUrl ? ` — <a href="${esc(contactProfile.linkedinUrl)}" style="color:#e31937;">LinkedIn</a>` : ""}</p>

  <h3>Comment aborder l'entretien</h3>
  <p style="font-size:13px;margin-bottom:8px;"><strong>Ton :</strong> ${esc(contactProfile.roleInsights.communicationStyle.tone)}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:600;color:#166534;margin-bottom:6px;">À FAIRE</div>
      ${contactProfile.roleInsights.communicationStyle.doList.map((d) => `<div style="font-size:12px;color:#166534;padding:2px 0;">✓ ${esc(d)}</div>`).join("")}
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;">
      <div style="font-size:11px;font-weight:600;color:#991b1b;margin-bottom:6px;">À ÉVITER</div>
      ${contactProfile.roleInsights.communicationStyle.dontList.map((d) => `<div style="font-size:12px;color:#991b1b;padding:2px 0;">✗ ${esc(d)}</div>`).join("")}
    </div>
  </div>

  ${contactProfile.roleInsights.icebreakers.length > 0 ? `
  <h3>Accroches suggérées</h3>
  ${contactProfile.roleInsights.icebreakers.map((ic) => `
  <div style="font-size:13px;font-style:italic;color:#666;background:#f8f9fa;border-left:3px solid #e31937;padding:6px 12px;margin:6px 0;">« ${esc(ic)} »</div>`).join("")}` : ""}

  ${contactProfile.roleInsights.typicalChallenges.length > 0 ? `
  <h3>Enjeux typiques du poste</h3>
  <ul class="fact-list">
    ${contactProfile.roleInsights.typicalChallenges.map((c) => `<li>${esc(c)}</li>`).join("")}
  </ul>` : ""}

  ${contactProfile.roleInsights.decisionFactors.length > 0 ? `
  <h3>Facteurs de décision</h3>
  <ul class="fact-list">
    ${contactProfile.roleInsights.decisionFactors.map((f) => `<li>${esc(f)}</li>`).join("")}
  </ul>` : ""}

  ${contactProfile.verifiedInfo.background ? `
  <h3>Parcours vérifié</h3>
  <p style="font-size:13px;">${esc(contactProfile.verifiedInfo.background)}</p>` : ""}

  ${contactProfile.verifiedInfo.keyFacts.length > 0 ? `
  <h3>Informations vérifiées</h3>
  <ul class="fact-list">
    ${contactProfile.verifiedInfo.keyFacts.map((f) => `<li>${esc(f)}</li>`).join("")}
  </ul>` : ""}

  ${contactProfile.verifiedInfo.publications.length > 0 ? `
  <h3>Publications & interventions</h3>
  <ul class="fact-list">
    ${contactProfile.verifiedInfo.publications.map((p) => `<li>${esc(p)}</li>`).join("")}
  </ul>` : ""}

  ${contactProfile.verifiedInfo.sources.length > 0 ? `
  <div class="sources">${contactProfile.verifiedInfo.sources.map((s) => `<a href="${esc(s.url)}">${esc(s.title)}</a>`).join("")}</div>` : ""}

  <p style="font-size:11px;color:#888;margin-top:8px;font-style:italic;">Les conseils d'approche sont basés sur le rôle de ${esc(contactProfile.role)}.</p>
  ` : ""}

  ${offeringsMapping.length > 0 ? `
  <h2>🧩 Mapping Enjeux → Offres CGI</h2>
  ${[...offeringsMapping].sort((a, b) => b.relevanceScore - a.relevanceScore).map((m) => `
  <div class="offering-card">
    <div style="display:flex;justify-content:space-between;align-items:start;">
      <div>
        <div class="offering-issue">${esc(m.issueName)}</div>
        <div class="offering-desc">${esc(m.issueDescription)}</div>
      </div>
      <span class="badge ${m.relevanceScore >= 80 ? "badge-score-high" : m.relevanceScore >= 60 ? "badge-score-mid" : "badge-score-low"}">${m.relevanceScore}%</span>
    </div>
    <div class="offering-name">→ ${esc(m.offering.name)}</div>
    <div class="offering-reason">${esc(m.reasoning)}</div>
  </div>`).join("")}
  ` : ""}

  ${sorted.length > 0 ? `
  <h2>❓ Trame de Questions (${sorted.length})</h2>
  ${phaseOrder.map((phase) => {
    const qs = sorted.filter((q) => q.phase === phase);
    if (qs.length === 0) return "";
    return `
    <div class="question-phase">
      <span class="phase-label phase-${phase}">${phaseLabels[phase]}</span>
      <span style="font-size:11px;color:#888;margin-left:8px;">${qs.length} question${qs.length > 1 ? "s" : ""}</span>
    </div>
    ${qs.map((q, i) => `
    <div class="question-item ${phase}" ${q.priority ? 'style="background:#fffbeb;border-width:2px;"' : ""}>
      <div class="question-text">${q.priority ? "⭐ " : ""}${i + 1}. ${esc(q.question)}${q.isCustom ? ' <span style="font-size:10px;color:#7c3aed;border:1px solid #c4b5fd;border-radius:4px;padding:1px 4px;">Perso</span>' : ""}</div>
      <div class="question-intent">🎯 ${esc(q.intent)}</div>
    </div>`).join("")}`;
  }).join("")}
  ` : ""}

  ${alerts.length > 0 ? `
  <h2>⚠️ Alertes & Points d'attention</h2>
  ${alerts.map((a) => `
  <div class="alert-item alert-${a.severity}">
    <div style="display:flex;justify-content:space-between;">
      <div class="alert-title">${severityLabels[a.severity] || ""} ${esc(a.title)}</div>
      <span class="alert-type">${typeLabels[a.type] || a.type}</span>
    </div>
    <div class="alert-desc">${esc(a.description)}</div>
    ${a.source ? `<a href="${esc(a.source.url)}" style="font-size:11px;color:#e31937;">${esc(a.source.title)}</a>` : ""}
  </div>`).join("")}
  ` : ""}

  <div class="footer">
    <strong>CGI — Consultant Augmenté</strong><br>
    Document généré automatiquement à partir de sources web. Vérifiez les informations avant utilisation.
  </div>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
