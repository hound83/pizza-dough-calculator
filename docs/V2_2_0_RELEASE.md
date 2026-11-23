# v2.2.0 · Dough routes and the first ball

## Plan and Kitchen

| Plan choice | Preparation | Rise |
| --- | --- | --- |
| Express | Weigh, mix and knead. Allow about one hour from starting to shaping in a warm place. | About 20–30 minutes together, then 15–20 minutes as balls. Judge volume and extensibility. Preheat in parallel. |
| Today | Existing same-day method with a 20-minute hydration rest after yeast is added. | 2 hours together and 6 hours as balls at 21 °C. |
| Tomorrow | Existing default method. Choose 30 or 60 minutes for flour and water in the fridge before adding yeast. | 1 hour at room temperature, 20 hours refrigerated in bulk and 4 hours as balls at 21 °C. |

For a four-ball KitchenAid batch at 220 g per ball, 63% hydration, 21 °C room, 4 °C fridge and a 24 °C target, changing the cold rest from 30 to 60 minutes moves the calculated main water from about 18 to 25 °C. It adds 30 minutes to the preparation calendar. The choice travels with a shared or saved dough recipe. The best rest depends on the flour and the dough. [Autolyse comparison](https://www.kingarthurbaking.com/blog/2017/09/29/using-the-autolyse-method)

Express uses 64% water, 2.4% salt and 1⅓% instant yeast on flour weight. Its equivalents are 2% active dry yeast or 4% fresh yeast. All mixing water goes into the dough together. Oiled containers and dusting flour are handling aids. Active dry yeast has a five-minute activation allowance. The suggested warm proofing spot defaults to 26 °C as an editable planning assumption. A cool room can extend the wait. The reference recipe specifies a warm spot without an exact temperature. [Ooni Quick Pizza Dough](https://ca.ooni.com/blogs/recipes/quick-pizza-dough)

The first-ball check lives beside the stretching instructions. A tight ball gets a new check in 15 minutes. A supple ball can be shaped. A slack ball can be baked smaller. A torn but tight ball can rest again. A check belongs to the selected mixer run or the untracked kitchen and is optional. Its timer and outcome survive a reload. Choosing a response records an observation and leaves ingredient quantities and planned bake time under the baker’s control.

## Temperature and fermentation

The core and outer dough begin at the same mixed-dough temperature. Both temperatures carry through every phase and through balling. The outer zone exchanges heat with the room or fridge. The zones exchange heat with each other. Each zone contributes its mass-weighted yeast activity and maturation index. The displayed temperature is the estimated core. Yeast already weighed or mixed remains fixed.

| Input or assumption | Implementation |
| --- | --- |
| Mass and shape | Ball weight for each ball. The warm bulk uses the full batch or mixer run. Refrigerated bulk uses mass per occupied box. An optional measured depth sets the height of an equal-volume ellipsoid. Otherwise height is 1.55 times the equal-volume sphere radius. |
| Material | Density 1,100 kg/m³, heat capacity 2,700 J/(kg·K), conductivity 0.40 W/(m·K). Fixed approximations for raw wheat dough. Gas content, flour and hydration vary. |
| Heat transfer | Weighted core and outer capacities of 40% and 60%. The internal rate is twice the diffusivity times the sum of inverse squared semi-axes. The effective surface coefficient is 6.5 W/(m²·K) in the fridge and 8 in the kitchen. Refrigerated stacking multiplies it by 0.72, a full fridge by 0.85. These coefficients and geometry are engineering assumptions. |
| Time window | Calculated elapsed time after fridge exit to an 18 °C centre over faster and slower exposure settings. Fridge and kitchen multipliers 0.4 and 1.8 vary independently. Endpoints are rounded outward to quarter hours. This is a sensitivity range. Opening the ball by feel remains the direct readiness check. |

The two linear energy balances are solved analytically within each phase. Gas and maturation are integrated from both local temperatures at intervals up to 0.12 hours. The staged water-temperature model and AVPN official yeast limits retain their own contracts. [Dough calorimetry](https://doi.org/10.1016/j.jcs.2010.11.002) · [Dough conductivity during proofing](https://doi.org/10.1016/j.fbp.2008.04.002) · [ASHRAE heat transfer](https://handbook.ashrae.org/Handbooks/F25/SI/f25_ch04/f25_ch04_si.aspx)

## Checks against external observations

| Experiment | Observation | v2.2 result and limitation |
| --- | --- | --- |
| Refrigeration from 19.9 °C at 3 °C | At hours 1, 2, 4 and 8 the logger read 17.9, 12.8, 7.3 and 4.0 °C. | Using the reported upper mass bound of 1 kg, one box and unknown depth gives 17.3, 13.7, 8.6 and 4.5 °C. At one hour v2.1 gave 14.1 °C. The exact mass, shape and local air temperature are unknown. [Nippala, table 10](https://www.theseus.fi/bitstream/10024/338486/2/Nippala_Henri.pdf#page=39) |
| Slow warm-up in a pizza lab | Balls up to 340 g took 2–2½ hours to rise from about 1.7 to 10 °C in air around 20–21 °C. | At 340 g and 20.55 °C the exposure range reaches 10 °C after 0.90–2.52 hours. The published times cover a group of balls. [Tom Lehmann, reply 12](https://www.pizzamaking.com/forum/index.php?topic=17851.0) |
| Fast home warm-up of a 300 g sourdough ball | A central probe read 15.6, 21.1 and 22.2 °C after 60, 90 and 120 minutes in air near 22.8 °C. | This ball warmed unusually rapidly relative to the nominal model. Starting both zones at a hypothetical 4 °C gives 10.8, 14.0 and 16.3 °C. Actual starting temperature, outer-zone temperature, contact and shape were unavailable. Resetting both zones to the 60-minute core measurement would discard the warmer outside. [Home measurement, reply 4](https://www.pizzamaking.com/forum/index.php?topic=65915.0) |

These checks cover different setups. Population accuracy and interval coverage still need independent complete kitchen runs. Hold out entire kitchens and compare first-four-hour core errors, time-to-temperature errors and observed ease of opening separately. The test target proposed for future data is mean absolute error at most 1.5 °C and crossing-time error at most 30 minutes. The app does not claim that target across kitchens.

## Storage and release baseline

Schema 55 reads schema 54 and earlier data using the established write-before-removal policy. Older dough recipes restore the standard mixing method and 30-minute cold rest. Existing planned and recorded batch times, ingredients, toppings, shopping and favorites carry forward. Old depth entries become model inputs only after the user enters a depth for the new model. New dough links carry the mixing route and rest choice. Box measurements, timers and first-ball observations stay local. For a software rollback use the preceding deployment, commit `75c7ccf`; keep a version-55 private backup for returning to this version.

Reference calculation at 880 g, 220 g per ball, 24 °C starting dough, 21 °C room, 4 °C fridge and 1/20/4 hours with 3% salt, using default boxes:

| Fridge route | Equivalent yeast hours at 21 °C | Final core | Practical IDY recommendation |
| --- | ---: | ---: | ---: |
| Bulk | 5.843 | 19.80 °C | 0.1733% |
| Balls | 5.175 | 19.80 °C | 0.1910% |

These numbers pin the new calculation. The preceding release hashes remain in the product guardrails.
