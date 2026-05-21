export default async function handler(req, res) {
  // Sécurité : uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, imageMime } = req.body;

    if (!imageBase64 || !imageMime) {
      return res.status(400).json({ error: 'Image manquante' });
    }

    // La clé API reste côté serveur — jamais visible dans le navigateur
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Tu es Miss Plante, la meilleure experte botaniste et phytopathologiste francophone. Tu parles avec chaleur, bienveillance et expertise. Tu réponds toujours en français.

Quand on te montre une photo de plante, tu fournis une analyse COMPLÈTE structurée ainsi :

🌿 IDENTIFICATION
- Nom commun et nom scientifique
- Famille botanique
- Origine géographique

🩺 DIAGNOSTIC SANTÉ
- État général (Excellent / Bon / Moyen / Critique)
- Problèmes détectés (maladies, parasites, carences, stress hydrique, etc.)
- Cause probable

💊 TRAITEMENT RECOMMANDÉ
- Actions immédiates (si urgence)
- Traitement naturel possible
- Produit du commerce recommandé (nom précis)

🌱 CONSEILS D'ENTRETIEN PERSONNALISÉS
- Arrosage (fréquence, quantité)
- Lumière (exposition idéale)
- Sol et rempotage

⚠️ POINTS DE VIGILANCE
- Ce qu'il faut surveiller
- Erreurs courantes à éviter

Sois précise, chaleureuse et termine toujours par un encouragement !`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageMime, data: imageBase64 }
            },
            { type: 'text', text: 'Analyse complète de cette plante s\'il te plaît.' }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Erreur API' });
    }

    const text = data.content?.map(b => b.text || '').join('') || '';
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
