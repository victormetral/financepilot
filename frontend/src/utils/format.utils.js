// ============================================================
// POINT D'ENTRÉE DES CALCULS FINANCIERS
// ============================================================
//
// Ce fichier ne contient plus aucun calcul : il réexporte
// simplement le contenu des quatre fichiers qui l'ont
// remplacé.
//
// Il regroupait sept sujets sans rapport — dates, soldes,
// portefeuille, flux, budget, projection, formatage — et
// dépassait 220 lignes de code.
//
// Il est conservé pour ne pas avoir à modifier tous les
// fichiers qui l'importent dans le même mouvement. Les imports
// seront redirigés progressivement vers les fichiers
// spécialisés, puis ce fichier disparaîtra.
//
// Pour un nouveau code, importer directement :
// - date.utils.js       → dates de transaction
// - patrimoine.utils.js → soldes, portefeuille, patrimoine net
// - budget.utils.js     → flux du mois, reste-à-vivre, projections
// - format.utils.js     → affichage des montants et des dates

export {
  extraireDate,
  estDansLeMois,
  joursDansLeMois,
  joursRestantsDansLeMois,
} from "./date.utils.js"

export {
  calculerSoldeCompte,
  calculerTotalLiquidites,
  calculerPositionActif,
  calculerValeurPortefeuille,
  calculerPatrimoineNet,
} from "./patrimoine.utils.js"

export {
  calculerFluxDuMois,
  calculerResteAVivre,
  calculerCoutOpportunite,
  projeterAtteinteObjectif,
} from "./budget.utils.js"

export {
  formaterMontant,
  formaterPourcentage,
  formaterMoisAnnee,
} from "./format.utils.js"