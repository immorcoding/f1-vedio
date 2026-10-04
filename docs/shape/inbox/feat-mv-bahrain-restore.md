# Shape inbox: feat/mv-bahrain-restore

Signals (2026-10-04):

- Art direction, user correction: Bahrain polish 2 was judged worse overall than revision 1. The part went back to
  revision 1, keeping only the 3.3 impact effects (jolt, scrape sparks, pre-freeze white flash), the FIA 29° path plus
  22° yaw, the 3.5 medical car's hard braking, and 27 秒.
- Art direction, user correction: "烟雾固定为泡泡烟". Tyre and brake smoke is bubble smoke (round, ink-edged puffs), not
  ink-stroke ribbons. This now covers 3.2 and the medical car's braking smoke in 3.5. **Proposed:** make it a rule in
  art-direction.md ("tyre/brake smoke is drawn as round bubble puffs").
- Motion & timing, the rule broken by code: the people library's `climbRail` was physically impossible. Its hands slid
  along the rail between keys, the hip dropped below the 1.29 m top edge while the far leg was still on the far side
  (so the leg passed through the rails), and a limb could switch draw layer while it was below the top edge. The
  climb is rebuilt so the hands are fixed while they grip, a limb only changes sides when every joint is above the top
  edge, and the body only changes sides once the hip is over the edge (sit astride, swing the far leg over while
  seated, then drop down). **Proposed:** a MOT rule for people crossing obstacles: "contact points (hands on a rail,
  feet on the ground) stay fixed while loaded; nothing changes draw layer while it overlaps the obstacle".
- Art direction: 3.5's 27 秒 panel stages the rail over the halo from a higher (1.6 m) camera so the occlusion reads:
  the cell, then the arm coming out of the cockpit, then the top rail lying on the hoop, then the fingers over its edge.
