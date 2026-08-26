# EXTRACTED_FORMULAS.md

Every formula in `Trunion_Included.xlsx`, transcribed verbatim from the
file, with its cached value. Generated mechanically from the workbook —
not retyped — so it cannot drift from its source.

| | |
|---|---|
| Source file | `hispl-v2/source/Trunion_Included.xlsx` |
| Size | 1,49,146 bytes |
| Sheets | 24 |
| Defined names | 129 |
| Formula cells | 436 |
| Extraction | pure Node: `zlib.inflateRawSync` + ZIP walk + XML read of `<f>` / `<v>` |

`(shared//inherited)` marks an Excel *shared formula* — Excel stores the
expression once on the first cell of a run and the siblings inherit it
with their references shifted. The cached value is still exact.

---

## Dependency order

The workbook computes in this order. Preserve it.

```
  Inquiry Input          11 operator inputs
        |
  Master sheets          Material / Machine Rate / Machine Time / Process Rate
        |                (pure data — zero formulas)
        v
  12 component sheets    Section A material -> B process -> C welding
        |                -> D additional -> E component total
        v
  Cost Summary           sums the 12, adds bought-out/seal/assembly/
        |                painting/packing, then reconditioning
        v
  Final Output           the quotation figure
```

Within every component sheet the internal order is fixed:

```
  Material Grade (input)
    -> Density   = INDEX/MATCH into Material Master col 3
    -> Rate      = INDEX/MATCH into Material Master col 4
    -> Unit Weight  = geometry x Density / 1e6
    -> Material Cost = IF(New Material?="No", 0, Unit Weight x Rate)
  Process rows (each independently)
    -> Hours = INDEX/MATCH or VLOOKUP into Machine Time Master
    -> Rate  = INDEX/MATCH into Machine Rate Master, or a Rate Card
    -> Cost  = IF(Apply?="Yes", Hours x Rate, 0)
  Welding (Tube and Piston Rod only)
  Process subtotal = SUM(process costs) + welding totals
  Component total  = Material + Process + Additional
```

---

## Master sheets carry no formulas

| Sheet | Cells | Formulas |
|---|---|---|
| Material Master | 57 | **0** |
| Machine Rate Master | 28 | **0** |
| Machine Time Master | 297 | **0** |
| Process Rate Master | 101 | **0** |

They are pure lookup data. Every rate enters the calculation through a
formula on a component sheet, never by being typed there.

---

## Component sheets

### Tube

`51` formulas, `223` populated cells, **`1` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | EN8 |
| `B7` | INPUT | Raw OD |  | 110 |
| `C7` | INPUT | Raw OD |  | mm |
| `B8` | INPUT | Finished OD |  | 108 |
| `C8` | INPUT | Finished OD |  | mm |
| `B9` | INPUT | Finished ID |  | 100.4 |
| `C9` | INPUT | Finished ID |  | mm |
| `B10` | INPUT | Length |  | 900 |
| `C10` | INPUT | Length |  | mm |
| `B11` | INPUT | Quantity (Nos) |  | 1 |
| `B14` | looked-up | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.85 |
| `B15` | looked-up | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 68 |
| `B16` | derived | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2-(B9)^2)*B10*B14/1000000` | 11.207765 |
| `B17` | derived | Total Weight for Qty (kg) | `B16*B11` | 11.207765 |
| `B18` | derived | Material Cost / pc (Rs.) | `IF(B4="No",0,B16*B15)` | 762.1280197 |
| `B19` | derived | Total Material Cost for Qty (Rs.) | `B18*B11` | 762.1280197 |
| `B21` | INPUT | Hole Diameter (mm) [for Drilling] |  | 12 |
| `B22` | INPUT | No. of Holes |  | 4 |
| `B25` | INPUT | Apply? |  | Process |
| `C25` | INPUT | Apply? |  | Machine / Basis |
| `D25` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E25` | INPUT | Apply? |  | Rate (Rs.) |
| `F25` | INPUT | Apply? |  | Cost (Rs.) |
| `B26` | INPUT | Yes |  | Cutting |
| `C26` | INPUT | Yes |  | Cutting Machine |
| `D26` | looked-up | Yes | `INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B10,CuttingLenBins,1))` | 0.15 |
| `E26` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | derived | Yes | `IF(A26="Yes",D26*E26,0)` | 52.5 |
| `B27` | INPUT | Yes |  | Rough Turning |
| `C27` | INPUT | Yes |  | Conventional La… |
| `D27` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())` | 0.9 |
| `E27` | looked-up | Yes | `VLOOKUP(B8,TurningRateTable,3,TRUE())` | 550 |
| `F27` | derived | Yes | `(shared//inherited)` | 495 |
| `B28` | INPUT | No |  | Boring |
| `C28` | INPUT | No |  | Conventional La… |
| `D28` | looked-up | No | `INDEX(BoringTable,MATCH(B9,BoringIDBins,1),MATCH(B10,BoringLenBins,1))` | 1.2 |
| `E28` | **ERROR** | No | `INDEX(MachineRateMaster_Range,MATCH("Conventional Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | **#N/A** |
| `F28` | derived | No | `(shared//inherited)` | 0 |
| `B29` | INPUT | Yes |  | Drilling |
| `C29` | INPUT | Yes |  | Drilling Machine |
| `D29` | looked-up | Yes | `VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.2 |
| `E29` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | derived | Yes | `(shared//inherited)` | 50 |
| `B30` | INPUT | Yes |  | Rough Honing |
| `C30` | INPUT | Yes |  | Honing Machine |
| `D30` | derived | Yes | `PI()*B9*B10/100` | 2838.743122 |
| `E30` | derived | Yes | `IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)` | 0.4 |
| `F30` | derived | Yes | `(shared//inherited)` | 1135.497249 |
| `B31` | INPUT | Yes |  | Finish Turning |
| `C31` | INPUT | Yes |  | CNC Lathe |
| `D31` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*0.7` | 0.63 |
| `E31` | looked-up | Yes | `VLOOKUP(B8,TurningRateTable,4,TRUE())` | 550 |
| `F31` | derived | Yes | `(shared//inherited)` | 346.5 |
| `B32` | INPUT | Yes |  | Finished Honing |
| `C32` | INPUT | Yes |  | Honing Machine |
| `D32` | derived | Yes | `PI()*B9*B10/100` | 2838.743122 |
| `E32` | derived | Yes | `IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)` | 0.4 |
| `F32` | derived | Yes | `(shared//inherited)` | 1135.497249 |
| `B36` | INPUT | Weld Diameter (mm) |  | 108 |
| `B37` | derived | No. of Beads (auto) | `IF(B36<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B38` | derived | Total Weld Length (mm) | `PI()*B36*B37` | 1696.460033 |
| `B39` | derived | Welding Time (Hr) | `B38/WeldSpeed` | 0.471238898 |
| `B40` | derived | Labour Cost (Rs.) | `B39*WeldLabourRate` | 176.7145868 |
| `B41` | derived | Wire Cost (Rs.) | `B39*WeldDepositionRate*WeldWireRate` | 135.7168026 |
| `B42` | derived | Total Welding Cost (Rs.) | `B40+B41` | 312.4313894 |
| `B45` | INPUT | Weld Diameter (mm) |  | 108 |
| `B46` | derived | No. of Beads (auto) | `IF(B45<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B47` | derived | Total Weld Length (mm) | `PI()*B45*B46` | 1696.460033 |
| `B48` | derived | Welding Time (Hr) | `B47/WeldSpeed` | 0.471238898 |
| `B49` | derived | Labour Cost (Rs.) | `B48*WeldLabourRate` | 176.7145868 |
| `B50` | derived | Wire Cost (Rs.) | `B48*WeldDepositionRate*WeldWireRate` | 135.7168026 |
| `B51` | derived | Total Welding Cost (Rs.) | `B49+B50` | 312.4313894 |
| `B54` | INPUT | Weld Diameter (mm) |  | 108 |
| `B55` | derived | No. of Beads (auto) | `IF(B54<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B56` | derived | Total Weld Length (mm) | `PI()*B54*B55` | 1696.460033 |
| `B57` | derived | Welding Time (Hr) | `B56/WeldSpeed` | 0.471238898 |
| `B58` | derived | Labour Cost (Rs.) | `B57*WeldLabourRate` | 176.7145868 |
| `B59` | derived | Wire Cost (Rs.) | `B57*WeldDepositionRate*WeldWireRate` | 135.7168026 |
| `B60` | derived | Total Welding Cost (Rs.) | `B58+B59` | 312.4313894 |
| `B63` | derived | Total Process & Vendor Cost / pc (Rs.) | `F26+F27+F28+F29+F30+F31+F32+B42+B51+B60` | 4152.288666 |
| `B66` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B70` | INPUT | Cost Head |  | Rs. / pc |
| `B71` | derived | Material Cost | `B18` | 762.1280197 |
| `B72` | derived | Process Cost | `B63` | 4152.288666 |
| `B73` | derived | Additional Cost | `B66` | 0 |
| `B74` | derived | TOTAL TUBE COST / pc | `B18+B63+B66` | 4914.416685 |
| `B75` | derived | TOTAL TUBE COST for Qty | `B74*B11` | 4914.416685 |

### Piston Rod

`46` formulas, `201` populated cells

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | EN19 |
| `B7` | INPUT | Raw Diameter |  | 62 |
| `C7` | INPUT | Raw Diameter |  | mm |
| `B8` | INPUT | Finished Diameter |  | 56 |
| `C8` | INPUT | Finished Diameter |  | mm |
| `B9` | INPUT | Length |  | 1150 |
| `C9` | INPUT | Length |  | mm |
| `B10` | INPUT | Quantity (Nos) |  | 1 |
| `B13` | looked-up | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.85 |
| `B14` | looked-up | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 92 |
| `B15` | derived | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2)*B9*B13/1000000` | 27.2546593 |
| `B16` | derived | Total Weight for Qty (kg) | `B15*B10` | 27.2546593 |
| `B17` | derived | Material Cost / pc (Rs.) | `IF(B4="No",0,B15*B14)` | 2507.428656 |
| `B18` | derived | Total Material Cost for Qty (Rs.) | `B17*B10` | 2507.428656 |
| `B20` | INPUT | Machined Width (mm) [for Milling] |  | 20 |
| `B21` | INPUT | Machined Length (mm) [for Milling] |  | 40 |
| `B22` | INPUT | Deep Hole Drilling Vendor Cost (Rs.) [manual] |  | 0 |
| `B25` | INPUT | Apply? |  | Process |
| `C25` | INPUT | Apply? |  | Machine / Basis |
| `D25` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E25` | INPUT | Apply? |  | Rate (Rs.) |
| `F25` | INPUT | Apply? |  | Cost (Rs.) |
| `B26` | INPUT | Yes |  | Cutting |
| `C26` | INPUT | Yes |  | Cutting Machine |
| `D26` | looked-up | Yes | `INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B9,CuttingLenBins,1))` | 0.15 |
| `E26` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | derived | Yes | `IF(A26="Yes",D26*E26,0)` | 52.5 |
| `B27` | INPUT | Yes |  | Rough Turning |
| `C27` | INPUT | Yes |  | CNC Lathe |
| `D27` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())` | 1.62 |
| `E27` | looked-up | Yes | `VLOOKUP(B8,TurningRateTable,3,TRUE())` | 300 |
| `F27` | derived | Yes | `(shared//inherited)` | 486 |
| `B29` | INPUT | Yes |  | Heat Treatment |
| `C29` | INPUT | Yes |  | Vendor (Rs./kg) |
| `D29` | derived | Yes | `B15` | 27.2546593 |
| `E29` | derived | Yes | `HeatTreatmentRate` | 12 |
| `F29` | derived | Yes | `IF(A29="Yes",D29*E29,0)` | 327.0559116 |
| `B30` | INPUT | Yes |  | Induction Harde… |
| `C30` | INPUT | Yes |  | Vendor (Rs./cm2) |
| `D30` | derived | Yes | `PI()*B8*B9/100` | 2023.185669 |
| `E30` | derived | Yes | `InductionHardeningRate` | 0.45 |
| `F30` | derived | Yes | `(shared//inherited)` | 910.433551 |
| `B31` | INPUT | Yes |  | Finish Turning |
| `C31` | INPUT | Yes |  | CNC Lathe |
| `D31` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*0.7` | 0.84 |
| `E31` | looked-up | Yes | `VLOOKUP(B8,TurningRateTable,4,TRUE())` | 400 |
| `F31` | derived | Yes | `(shared//inherited)` | 336 |
| `B32` | INPUT | Yes |  | Grinding |
| `C32` | INPUT | Yes |  | In-house (Rs./c… |
| `D32` | derived | Yes | `PI()*B8*B9/100` | 2023.185669 |
| `E32` | derived | Yes | `GrindingRate` | 0.4 |
| `F32` | derived | Yes | `(shared//inherited)` | 809.2742676 |
| `B33` | INPUT | Yes |  | Chrome Plating |
| `C33` | INPUT | Yes |  | Vendor (Rs./cm2) |
| `D33` | derived | Yes | `PI()*B8*B9/100` | 2023.185669 |
| `E33` | derived | Yes | `ChromePlatingRate` | 0.6 |
| `F33` | derived | Yes | `(shared//inherited)` | 1213.911401 |
| `B34` | INPUT | Yes |  | Polishing |
| `C34` | INPUT | Yes |  | In-house (Rs./c… |
| `D34` | derived | Yes | `PI()*B8*B9/100` | 2023.185669 |
| `E34` | derived | Yes | `PolishingRate` | 0.2 |
| `F34` | derived | Yes | `(shared//inherited)` | 404.6371338 |
| `B35` | INPUT | Yes |  | Milling |
| `C35` | INPUT | Yes |  | Milling Machine |
| `D35` | looked-up | Yes | `VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3 |
| `E35` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F35` | derived | Yes | `(shared//inherited)` | 105 |
| `B36` | INPUT | Yes |  | Deep Hole Drill… |
| `C36` | INPUT | Yes |  | Vendor Cost (ma… |
| `D36` | INPUT | Yes |  | Manual |
| `E36` | INPUT | Yes |  | Manual |
| `F36` | derived | Yes | `B22` | 0 |
| `B40` | INPUT | Weld Diameter (mm) |  | 56 |
| `B41` | derived | No. of Beads (auto) | `IF(B40<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B42` | derived | Total Weld Length (mm) | `PI()*B40*B41` | 879.645943 |
| `B43` | derived | Welding Time (Hr) | `B42/WeldSpeed` | 0.2443460953 |
| `B44` | derived | Labour Cost (Rs.) | `B43*WeldLabourRate` | 91.62978573 |
| `B45` | derived | Wire Cost (Rs.) | `B43*WeldDepositionRate*WeldWireRate` | 70.37167544 |
| `B46` | derived | Total Welding Cost (Rs.) | `B44+B45` | 162.0014612 |
| `B49` | derived | Total Process & Vendor Cost / pc (Rs.) | `F26+F27+F29+F30+F31+F32+F33+F34+F35+F36+B46` | 4806.813726 |
| `B52` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B56` | INPUT | Cost Head |  | Rs. / pc |
| `B57` | derived | Material Cost | `B17` | 2507.428656 |
| `B58` | derived | Process Cost | `B49` | 4806.813726 |
| `B59` | derived | Additional Cost | `B52` | 0 |
| `B60` | derived | TOTAL PISTON ROD COST / pc | `B17+B49+B52` | 7314.242382 |
| `B61` | derived | TOTAL PISTON ROD COST for Qty | `B60*B10` | 7314.242382 |

### Cap End Cover

`21` formulas, `143` populated cells, **`9` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Raw Material Shape |  | Round |
| `C5` | INPUT | Raw Material Shape |  | Round = solid r… |
| `B6` | INPUT | Parameter |  | Value |
| `C6` | INPUT | Parameter |  | Unit |
| `B7` | INPUT | Material Grade |  | MS-C45 |
| `B8` | INPUT | Diameter |  | 100 |
| `C8` | INPUT | Diameter |  | mm - fill if Sh… |
| `B9` | INPUT | Width |  | 160 |
| `C9` | INPUT | Width |  | mm - fill if Sh… |
| `B10` | INPUT | Height |  | 100 |
| `C10` | INPUT | Height |  | mm - fill if Sh… |
| `B11` | INPUT | Thickness |  | 60 |
| `C11` | INPUT | Thickness |  | mm |
| `B12` | INPUT | Finished OD |  | 220 |
| `C12` | INPUT | Finished OD |  | mm - used for T… |
| `B13` | INPUT | Quantity (Nos) |  | 1 |
| `B16` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B17` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B18` | **ERROR** | Unit Weight (kg / pc) | `IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | **#N/A** |
| `B19` | **ERROR** | Total Weight for Qty (kg) | `B18*B13` | **#N/A** |
| `B20` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B18*B17)` | **#N/A** |
| `B21` | **ERROR** | Total Material Cost for Qty (Rs.) | `B20*B13` | **#N/A** |
| `B23` | INPUT | Machined Width (mm) [for Milling] |  | 40 |
| `B24` | INPUT | Machined Length (mm) [for Milling] |  | 40 |
| `B25` | INPUT | Hole Diameter (mm) [for Drilling] |  | 14 |
| `B26` | INPUT | No. of Holes |  | 4 |
| `B29` | INPUT | Apply? |  | Process |
| `C29` | INPUT | Apply? |  | Machine / Basis |
| `D29` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E29` | INPUT | Apply? |  | Rate (Rs.) |
| `F29` | INPUT | Apply? |  | Cost (Rs.) |
| `B30` | INPUT | Yes |  | Turning |
| `C30` | INPUT | Yes |  | CNC Lathe |
| `D30` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))` | 0.8 |
| `E30` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F30` | derived | Yes | `IF(A30="Yes",D30*E30,0)` | 440 |
| `B31` | INPUT | Yes |  | Milling |
| `C31` | INPUT | Yes |  | Milling Machine |
| `D31` | looked-up | Yes | `VLOOKUP((B23)*(B24),MillingTable,3,TRUE())` | 0.3 |
| `E31` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F31` | derived | Yes | `(shared//inherited)` | 105 |
| `B32` | INPUT | No |  | Drilling |
| `C32` | INPUT | No |  | Drilling Machine |
| `D32` | looked-up | No | `VLOOKUP(B25,DrillingTable,3,TRUE())*B26` | 0.2 |
| `E32` | looked-up | No | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F32` | derived | No | `(shared//inherited)` | 0 |
| `B35` | derived | Total Process & Vendor Cost / pc (Rs.) | `F30+F31+F32` | 545 |
| `B38` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B42` | INPUT | Cost Head |  | Rs. / pc |
| `B43` | **ERROR** | Material Cost | `B20` | **#N/A** |
| `B44` | derived | Process Cost | `B35` | 545 |
| `B45` | derived | Additional Cost | `B38` | 0 |
| `B46` | **ERROR** | TOTAL CAP END COVER COST / pc | `B20+B35+B38` | **#N/A** |
| `B47` | **ERROR** | TOTAL CAP END COVER COST for Qty | `B46*B13` | **#N/A** |

### Head End Cover

`21` formulas, `143` populated cells, **`9` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Raw Material Shape |  | Round |
| `C5` | INPUT | Raw Material Shape |  | Round = solid r… |
| `B6` | INPUT | Parameter |  | Value |
| `C6` | INPUT | Parameter |  | Unit |
| `B7` | INPUT | Material Grade |  | MS-C45 |
| `B8` | INPUT | Diameter |  | 100 |
| `C8` | INPUT | Diameter |  | mm - fill if Sh… |
| `B9` | INPUT | Width |  | 160 |
| `C9` | INPUT | Width |  | mm - fill if Sh… |
| `B10` | INPUT | Height |  | 100 |
| `C10` | INPUT | Height |  | mm - fill if Sh… |
| `B11` | INPUT | Thickness |  | 60 |
| `C11` | INPUT | Thickness |  | mm |
| `B12` | INPUT | Finished OD |  | 220 |
| `C12` | INPUT | Finished OD |  | mm - used for T… |
| `B13` | INPUT | Quantity (Nos) |  | 1 |
| `B16` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B17` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B18` | **ERROR** | Unit Weight (kg / pc) | `IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | **#N/A** |
| `B19` | **ERROR** | Total Weight for Qty (kg) | `B18*B13` | **#N/A** |
| `B20` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B18*B17)` | **#N/A** |
| `B21` | **ERROR** | Total Material Cost for Qty (Rs.) | `B20*B13` | **#N/A** |
| `B23` | INPUT | Machined Width (mm) [for Milling] |  | 40 |
| `B24` | INPUT | Machined Length (mm) [for Milling] |  | 40 |
| `B25` | INPUT | Hole Diameter (mm) [for Drilling] |  | 14 |
| `B26` | INPUT | No. of Holes |  | 4 |
| `B29` | INPUT | Apply? |  | Process |
| `C29` | INPUT | Apply? |  | Machine / Basis |
| `D29` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E29` | INPUT | Apply? |  | Rate (Rs.) |
| `F29` | INPUT | Apply? |  | Cost (Rs.) |
| `B30` | INPUT | Yes |  | Turning |
| `C30` | INPUT | Yes |  | CNC Lathe |
| `D30` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))` | 0.8 |
| `E30` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F30` | derived | Yes | `IF(A30="Yes",D30*E30,0)` | 440 |
| `B31` | INPUT | Yes |  | Milling |
| `C31` | INPUT | Yes |  | Milling Machine |
| `D31` | looked-up | Yes | `VLOOKUP((B23)*(B24),MillingTable,3,TRUE())` | 0.3 |
| `E31` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F31` | derived | Yes | `(shared//inherited)` | 105 |
| `B32` | INPUT | Yes |  | Drilling |
| `C32` | INPUT | Yes |  | Drilling Machine |
| `D32` | looked-up | Yes | `VLOOKUP(B25,DrillingTable,3,TRUE())*B26` | 0.2 |
| `E32` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F32` | derived | Yes | `(shared//inherited)` | 50 |
| `B35` | derived | Total Process & Vendor Cost / pc (Rs.) | `F30+F31+F32` | 595 |
| `B38` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B42` | INPUT | Cost Head |  | Rs. / pc |
| `B43` | **ERROR** | Material Cost | `B20` | **#N/A** |
| `B44` | derived | Process Cost | `B35` | 595 |
| `B45` | derived | Additional Cost | `B38` | 0 |
| `B46` | **ERROR** | TOTAL HEAD END COVER COST / pc | `B20+B35+B38` | **#N/A** |
| `B47` | **ERROR** | TOTAL HEAD END COVER COST for Qty | `B46*B13` | **#N/A** |

### Gland

`24` formulas, `140` populated cells, **`9` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | MS-C45 |
| `B7` | INPUT | OD |  | 130 |
| `C7` | INPUT | OD |  | mm |
| `B8` | INPUT | ID |  | 57 |
| `C8` | INPUT | ID |  | mm |
| `B9` | INPUT | Length |  | 70 |
| `C9` | INPUT | Length |  | mm |
| `B10` | INPUT | Quantity (Nos) |  | 1 |
| `B13` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B14` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B15` | **ERROR** | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000` | **#N/A** |
| `B16` | **ERROR** | Total Weight for Qty (kg) | `B15*B10` | **#N/A** |
| `B17` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B15*B14)` | **#N/A** |
| `B18` | **ERROR** | Total Material Cost for Qty (Rs.) | `B17*B10` | **#N/A** |
| `B20` | INPUT | Machined Width (mm) |  | 30 |
| `B21` | INPUT | Machined Length (mm) |  | 30 |
| `B22` | INPUT | Hole Diameter (mm) |  | 10 |
| `B23` | INPUT | No. of Holes |  | 2 |
| `B26` | INPUT | Apply? |  | Process |
| `C26` | INPUT | Apply? |  | Machine / Basis |
| `D26` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E26` | INPUT | Apply? |  | Rate (Rs.) |
| `F26` | INPUT | Apply? |  | Cost (Rs.) |
| `B27` | INPUT | Yes |  | Turning |
| `C27` | INPUT | Yes |  | CNC Lathe |
| `D27` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))` | 0.5 |
| `E27` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F27` | derived | Yes | `IF(A27="Yes",D27*E27,0)` | 275 |
| `B28` | INPUT | Yes |  | Milling |
| `C28` | INPUT | Yes |  | Milling Machine |
| `D28` | looked-up | Yes | `VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3 |
| `E28` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F28` | derived | Yes | `(shared//inherited)` | 105 |
| `B29` | INPUT | Yes |  | Drilling |
| `C29` | INPUT | Yes |  | Drilling Machine |
| `D29` | looked-up | Yes | `VLOOKUP(B22,DrillingTable,3,TRUE())*B23` | 0.06 |
| `E29` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | derived | Yes | `(shared//inherited)` | 15 |
| `B30` | INPUT | Yes |  | Grinding (ID bo… |
| `C30` | INPUT | Yes |  | In-house (Rs./c… |
| `D30` | derived | Yes | `PI()*B8*B9/100` | 125.3495469 |
| `E30` | derived | Yes | `GrindingRate` | 0.4 |
| `F30` | derived | Yes | `(shared//inherited)` | 50.13981875 |
| `B33` | derived | Total Process & Vendor Cost / pc (Rs.) | `F27+F28+F29+F30` | 445.1398188 |
| `B36` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B40` | INPUT | Cost Head |  | Rs. / pc |
| `B41` | **ERROR** | Material Cost | `B17` | **#N/A** |
| `B42` | derived | Process Cost | `B33` | 445.1398188 |
| `B43` | derived | Additional Cost | `B36` | 0 |
| `B44` | **ERROR** | TOTAL GLAND COST / pc | `B17+B33+B36` | **#N/A** |
| `B45` | **ERROR** | TOTAL GLAND COST for Qty | `B44*B10` | **#N/A** |

### Cushion Bush

`18` formulas, `120` populated cells

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | BR-SAE660 |
| `B7` | INPUT | OD |  | 130 |
| `C7` | INPUT | OD |  | mm |
| `B8` | INPUT | ID |  | 57 |
| `C8` | INPUT | ID |  | mm |
| `B9` | INPUT | Length |  | 70 |
| `C9` | INPUT | Length |  | mm |
| `B10` | INPUT | Quantity (Nos) |  | 1 |
| `B13` | looked-up | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 8.9 |
| `B14` | looked-up | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 520 |
| `B15` | derived | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000` | 6.679476015 |
| `B16` | derived | Total Weight for Qty (kg) | `B15*B10` | 6.679476015 |
| `B17` | derived | Material Cost / pc (Rs.) | `IF(B4="No",0,B15*B14)` | 3473.327528 |
| `B18` | derived | Total Material Cost for Qty (Rs.) | `B17*B10` | 3473.327528 |
| `B22` | INPUT | Apply? |  | Process |
| `C22` | INPUT | Apply? |  | Machine / Basis |
| `D22` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E22` | INPUT | Apply? |  | Rate (Rs.) |
| `F22` | INPUT | Apply? |  | Cost (Rs.) |
| `B23` | INPUT | Yes |  | Turning |
| `C23` | INPUT | Yes |  | CNC Lathe |
| `D23` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))` | 0.5 |
| `E23` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F23` | derived | Yes | `IF(A23="Yes",D23*E23,0)` | 275 |
| `B24` | INPUT | Yes |  | Grinding (ID bo… |
| `C24` | INPUT | Yes |  | In-house (Rs./c… |
| `D24` | derived | Yes | `PI()*B8*B9/100` | 125.3495469 |
| `E24` | derived | Yes | `GrindingRate` | 0.4 |
| `F24` | derived | Yes | `(shared//inherited)` | 50.13981875 |
| `B27` | derived | Total Process & Vendor Cost / pc (Rs.) | `F23+F24` | 325.1398188 |
| `B30` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B34` | INPUT | Cost Head |  | Rs. / pc |
| `B35` | derived | Material Cost | `B17` | 3473.327528 |
| `B36` | derived | Process Cost | `B27` | 325.1398188 |
| `B37` | derived | Additional Cost | `B30` | 0 |
| `B38` | derived | TOTAL CUSHION BUSH COST / pc | `B17+B27+B30` | 3798.467346 |
| `B39` | derived | TOTAL CUSHION BUSH COST for Qty | `B38*B10` | 3798.467346 |

### Stop Tube

`15` formulas, `115` populated cells, **`9` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | MS-EN8 |
| `B7` | INPUT | Raw Diameter |  | 60 |
| `C7` | INPUT | Raw Diameter |  | mm |
| `B8` | INPUT | Finished Diameter |  | 56 |
| `C8` | INPUT | Finished Diameter |  | mm |
| `B9` | INPUT | Length |  | 150 |
| `C9` | INPUT | Length |  | mm |
| `B10` | INPUT | Quantity (Nos) |  | 1 |
| `B13` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B14` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B15` | **ERROR** | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2)*B9*B13/1000000` | **#N/A** |
| `B16` | **ERROR** | Total Weight for Qty (kg) | `B15*B10` | **#N/A** |
| `B17` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B15*B14)` | **#N/A** |
| `B18` | **ERROR** | Total Material Cost for Qty (Rs.) | `B17*B10` | **#N/A** |
| `B21` | INPUT | Apply? |  | Process |
| `C21` | INPUT | Apply? |  | Machine / Basis |
| `D21` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E21` | INPUT | Apply? |  | Rate (Rs.) |
| `F21` | INPUT | Apply? |  | Cost (Rs.) |
| `B22` | INPUT | Yes |  | Turning |
| `C22` | INPUT | Yes |  | CNC Lathe |
| `D22` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())` | 0.345 |
| `E22` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F22` | derived | Yes | `IF(A22="Yes",D22*E22,0)` | 189.75 |
| `B25` | derived | Total Process & Vendor Cost / pc (Rs.) | `F22` | 189.75 |
| `B28` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B32` | INPUT | Cost Head |  | Rs. / pc |
| `B33` | **ERROR** | Material Cost | `B17` | **#N/A** |
| `B34` | derived | Process Cost | `B25` | 189.75 |
| `B35` | derived | Additional Cost | `B28` | 0 |
| `B36` | **ERROR** | TOTAL STOP TUBE COST / pc | `B17+B25+B28` | **#N/A** |
| `B37` | **ERROR** | TOTAL STOP TUBE COST for Qty | `B36*B10` | **#N/A** |

### Rear Eye

`21` formulas, `131` populated cells, **`13` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | MS-PLATE-IS2062 |
| `B7` | INPUT | Raw Plate Thickness |  | 40 |
| `C7` | INPUT | Raw Plate Thickness |  | mm |
| `B8` | INPUT | Width |  | 160 |
| `C8` | INPUT | Width |  | mm |
| `B9` | INPUT | Height |  | 200 |
| `C9` | INPUT | Height |  | mm |
| `B10` | INPUT | Pin Hole Diameter |  | 56 |
| `C10` | INPUT | Pin Hole Diameter |  | mm |
| `B11` | INPUT | Quantity (Nos) |  | 1 |
| `B14` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B15` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B16` | **ERROR** | Unit Weight (kg / pc) | `(B8)*(B9)*(B7)*B14/1000000` | **#N/A** |
| `B17` | **ERROR** | Total Weight for Qty (kg) | `B16*B11` | **#N/A** |
| `B18` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B16*B15)` | **#N/A** |
| `B19` | **ERROR** | Total Material Cost for Qty (Rs.) | `B18*B11` | **#N/A** |
| `B21` | INPUT | No. of Pin Holes |  | 1 |
| `B24` | INPUT | Apply? |  | Process |
| `C24` | INPUT | Apply? |  | Machine / Basis |
| `D24` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E24` | INPUT | Apply? |  | Rate (Rs.) |
| `F24` | INPUT | Apply? |  | Cost (Rs.) |
| `B25` | INPUT | Yes |  | Profile Cutting |
| `C25` | INPUT | Yes |  | Process Rate Ma… |
| `D25` | **ERROR** | Yes | `B16` | **#N/A** |
| `E25` | derived | Yes | `ProfileCuttingRate` | 1.25 |
| `F25` | **ERROR** | Yes | `IF(A25="Yes",D25*E25,0)` | **#N/A** |
| `B26` | INPUT | Yes |  | Milling |
| `C26` | INPUT | Yes |  | Milling Machine |
| `D26` | looked-up | Yes | `VLOOKUP((B8)*(B9),MillingTable,3,TRUE())` | 1 |
| `E26` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | derived | Yes | `(shared//inherited)` | 350 |
| `B27` | INPUT | Yes |  | Drilling |
| `C27` | INPUT | Yes |  | Drilling Machine |
| `D27` | looked-up | Yes | `VLOOKUP(B10,DrillingTable,3,TRUE())*B21` | 0.12 |
| `E27` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F27` | derived | Yes | `(shared//inherited)` | 30 |
| `B30` | **ERROR** | Total Process & Vendor Cost / pc (Rs.) | `F25+F26+F27` | **#N/A** |
| `B33` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B37` | INPUT | Cost Head |  | Rs. / pc |
| `B38` | **ERROR** | Material Cost | `B18` | **#N/A** |
| `B39` | **ERROR** | Process Cost | `B30` | **#N/A** |
| `B40` | derived | Additional Cost | `B33` | 0 |
| `B41` | **ERROR** | TOTAL REAR EYE COST / pc | `B18+B30+B33` | **#N/A** |
| `B42` | **ERROR** | TOTAL REAR EYE COST for Qty | `B41*B11` | **#N/A** |

### Rod Eye

`21` formulas, `137` populated cells, **`13` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Raw Material Shape |  | Round |
| `C5` | INPUT | Raw Material Shape |  | Round = solid r… |
| `B6` | INPUT | Parameter |  | Value |
| `C6` | INPUT | Parameter |  | Unit |
| `B7` | INPUT | Material Grade |  | MS-PLATE-IS2062 |
| `B8` | INPUT | Diameter |  | 100 |
| `C8` | INPUT | Diameter |  | mm - fill if Sh… |
| `B9` | INPUT | Width |  | 160 |
| `C9` | INPUT | Width |  | mm - fill if Sh… |
| `B10` | INPUT | Height |  | 100 |
| `C10` | INPUT | Height |  | mm - fill if Sh… |
| `B11` | INPUT | Thickness |  | 60 |
| `C11` | INPUT | Thickness |  | mm |
| `B12` | INPUT | Pin Hole Diameter |  | 56 |
| `C12` | INPUT | Pin Hole Diameter |  | mm |
| `B13` | INPUT | Quantity (Nos) |  | 1 |
| `B16` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B17` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B18` | **ERROR** | Unit Weight (kg / pc) | `IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | **#N/A** |
| `B19` | **ERROR** | Total Weight for Qty (kg) | `B18*B13` | **#N/A** |
| `B20` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B18*B17)` | **#N/A** |
| `B21` | **ERROR** | Total Material Cost for Qty (Rs.) | `B20*B13` | **#N/A** |
| `B23` | INPUT | No. of Pin Holes |  | 1 |
| `B26` | INPUT | Apply? |  | Process |
| `C26` | INPUT | Apply? |  | Machine / Basis |
| `D26` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E26` | INPUT | Apply? |  | Rate (Rs.) |
| `F26` | INPUT | Apply? |  | Cost (Rs.) |
| `B27` | INPUT | Yes |  | Profile Cutting |
| `C27` | INPUT | Yes |  | Process Rate Ma… |
| `D27` | **ERROR** | Yes | `B18` | **#N/A** |
| `E27` | derived | Yes | `ProfileCuttingRate` | 1.25 |
| `F27` | **ERROR** | Yes | `IF(A27="Yes",D27*E27,0)` | **#N/A** |
| `B28` | INPUT | Yes |  | Milling |
| `C28` | INPUT | Yes |  | Milling Machine |
| `D28` | looked-up | Yes | `VLOOKUP((B9)*(B10),MillingTable,3,TRUE())` | 0.6 |
| `E28` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F28` | derived | Yes | `(shared//inherited)` | 210 |
| `B29` | INPUT | Yes |  | Drilling |
| `C29` | INPUT | Yes |  | Drilling Machine |
| `D29` | looked-up | Yes | `VLOOKUP(B12,DrillingTable,3,TRUE())*B23` | 0.12 |
| `E29` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | derived | Yes | `(shared//inherited)` | 30 |
| `B32` | **ERROR** | Total Process & Vendor Cost / pc (Rs.) | `F27+F28+F29` | **#N/A** |
| `B35` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B39` | INPUT | Cost Head |  | Rs. / pc |
| `B40` | **ERROR** | Material Cost | `B20` | **#N/A** |
| `B41` | **ERROR** | Process Cost | `B32` | **#N/A** |
| `B42` | derived | Additional Cost | `B35` | 0 |
| `B43` | **ERROR** | TOTAL ROD EYE COST / pc | `B20+B32+B35` | **#N/A** |
| `B44` | **ERROR** | TOTAL ROD EYE COST for Qty | `B43*B13` | **#N/A** |

### Piston

`21` formulas, `132` populated cells, **`13` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | MS-EN8 |
| `B7` | INPUT | OD |  | 100 |
| `C7` | INPUT | OD |  | mm |
| `B8` | INPUT | Length |  | 45 |
| `C8` | INPUT | Length |  | mm |
| `B9` | INPUT | Quantity (Nos) |  | 1 |
| `B12` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B13` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B14` | **ERROR** | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2)*B8*B12/1000000` | **#N/A** |
| `B15` | **ERROR** | Total Weight for Qty (kg) | `B14*B9` | **#N/A** |
| `B16` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B14*B13)` | **#N/A** |
| `B17` | **ERROR** | Total Material Cost for Qty (Rs.) | `B16*B9` | **#N/A** |
| `B19` | INPUT | Machined Width (mm) [Groove Milling] |  | 10 |
| `B20` | INPUT | Machined Length (mm) [Groove Milling] |  | 314 |
| `B21` | INPUT | Hole Diameter (mm) |  | 10 |
| `B22` | INPUT | No. of Holes |  | 4 |
| `B25` | INPUT | Apply? |  | Process |
| `C25` | INPUT | Apply? |  | Machine / Basis |
| `D25` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E25` | INPUT | Apply? |  | Rate (Rs.) |
| `F25` | INPUT | Apply? |  | Cost (Rs.) |
| `B26` | INPUT | Yes |  | Finish Turning |
| `C26` | INPUT | Yes |  | Process Rate Ma… |
| `D26` | **ERROR** | Yes | `B14` | **#N/A** |
| `E26` | derived | Yes | `ProfileCuttingRate` | 1.25 |
| `F26` | **ERROR** | Yes | `IF(A26="Yes",D26*E26,0)` | **#N/A** |
| `B27` | INPUT | Yes |  | Milling |
| `C27` | INPUT | Yes |  | Milling Machine |
| `D27` | looked-up | Yes | `VLOOKUP((B19)*(B20),MillingTable,3,TRUE())` | 0.3 |
| `E27` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F27` | derived | Yes | `(shared//inherited)` | 105 |
| `B28` | INPUT | Yes |  | Drilling |
| `C28` | INPUT | Yes |  | Drilling Machine |
| `D28` | looked-up | Yes | `VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.12 |
| `E28` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F28` | derived | Yes | `(shared//inherited)` | 30 |
| `B31` | **ERROR** | Total Process & Vendor Cost / pc (Rs.) | `F26+F27+F28` | **#N/A** |
| `B34` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B38` | INPUT | Cost Head |  | Rs. / pc |
| `B39` | **ERROR** | Material Cost | `B16` | **#N/A** |
| `B40` | **ERROR** | Process Cost | `B31` | **#N/A** |
| `B41` | derived | Additional Cost | `B34` | 0 |
| `B42` | **ERROR** | TOTAL PISTON COST / pc | `B16+B31+B34` | **#N/A** |
| `B43` | **ERROR** | TOTAL PISTON COST for Qty | `B42*B9` | **#N/A** |

### Flange

`21` formulas, `131` populated cells, **`9` cells currently in error**

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | MS-C45 |
| `B7` | INPUT | OD |  | 220 |
| `C7` | INPUT | OD |  | mm |
| `B8` | INPUT | Length |  | 60 |
| `C8` | INPUT | Length |  | mm |
| `B9` | INPUT | Quantity (Nos) |  | 1 |
| `B12` | **ERROR** | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | **#N/A** |
| `B13` | **ERROR** | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | **#N/A** |
| `B14` | **ERROR** | Unit Weight (kg / pc) | `(PI()/4)*((B7)^2)*B8*B12/1000000` | **#N/A** |
| `B15` | **ERROR** | Total Weight for Qty (kg) | `B14*B9` | **#N/A** |
| `B16` | **ERROR** | Material Cost / pc (Rs.) | `IF(B4="No",0,B14*B13)` | **#N/A** |
| `B17` | **ERROR** | Total Material Cost for Qty (Rs.) | `B16*B9` | **#N/A** |
| `B19` | INPUT | Machined Width (mm) [for Milling] |  | 40 |
| `B20` | INPUT | Machined Length (mm) [for Milling] |  | 40 |
| `B21` | INPUT | Hole Diameter (mm) [for Drilling] |  | 14 |
| `B22` | INPUT | No. of Holes |  | 4 |
| `B25` | INPUT | Apply? |  | Process |
| `C25` | INPUT | Apply? |  | Machine / Basis |
| `D25` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E25` | INPUT | Apply? |  | Rate (Rs.) |
| `F25` | INPUT | Apply? |  | Cost (Rs.) |
| `B26` | INPUT | Yes |  | Turning |
| `C26` | INPUT | Yes |  | CNC Lathe |
| `D26` | looked-up | Yes | `INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B8,TurningLenBins,1))` | 0.8 |
| `E26` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F26` | derived | Yes | `IF(A26="Yes",D26*E26,0)` | 440 |
| `B27` | INPUT | Yes |  | Milling |
| `C27` | INPUT | Yes |  | Milling Machine |
| `D27` | looked-up | Yes | `VLOOKUP((B19)*(B20),MillingTable,3,TRUE())` | 0.3 |
| `E27` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F27` | derived | Yes | `(shared//inherited)` | 105 |
| `B28` | INPUT | Yes |  | Drilling |
| `C28` | INPUT | Yes |  | Drilling Machine |
| `D28` | looked-up | Yes | `VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.2 |
| `E28` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F28` | derived | Yes | `(shared//inherited)` | 50 |
| `B31` | derived | Total Process & Vendor Cost / pc (Rs.) | `F26+F27+F28` | 595 |
| `B34` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B38` | INPUT | Cost Head |  | Rs. / pc |
| `B39` | **ERROR** | Material Cost | `B16` | **#N/A** |
| `B40` | derived | Process Cost | `B31` | 595 |
| `B41` | derived | Additional Cost | `B34` | 0 |
| `B42` | **ERROR** | TOTAL FLANGE COST / pc | `B16+B31+B34` | **#N/A** |
| `B43` | **ERROR** | TOTAL FLANGE COST for Qty | `B42*B9` | **#N/A** |

### Trunnion

`18` formulas, `147` populated cells

| Cell | Kind | Label | Formula | Cached |
|---|---|---|---|---|
| `B4` | INPUT | New Material? (Yes/No) |  | Yes |
| `C4` | INPUT | New Material? (Yes/No) |  | Choose 'No' if … |
| `B5` | INPUT | Parameter |  | Value |
| `C5` | INPUT | Parameter |  | Unit |
| `B6` | INPUT | Material Grade |  | EN8 |
| `B7` | INPUT | Length |  | 200 |
| `C7` | INPUT | Length |  | mm |
| `B8` | INPUT | Width |  | 100 |
| `C8` | INPUT | Width |  | mm |
| `B9` | INPUT | Height |  | 100 |
| `C9` | INPUT | Height |  | mm |
| `B10` | INPUT | Quantity (Nos) |  | 2 |
| `B13` | looked-up | Density (g/cm3) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.85 |
| `B14` | looked-up | Material Rate (Rs./kg) | `INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 68 |
| `B15` | derived | Unit Weight (kg / pc) | `(B7)*(B8)*(B9)*B13/1000000` | 15.7 |
| `B16` | derived | Total Weight for Qty (kg) | `B15*B10` | 31.4 |
| `B17` | derived | Material Cost / pc (Rs.) | `IF(B4="No",0,B15*B14)` | 1067.6 |
| `B18` | derived | Total Material Cost for Qty (Rs.) | `B17*B10` | 2135.2 |
| `B20` | INPUT | Machined Width (mm) [for Milling] |  | 40 |
| `B21` | INPUT | Machined Length (mm) [for Milling] |  | 40 |
| `B22` | INPUT | Hole Diameter (mm) [for Drilling] |  | 12 |
| `B23` | INPUT | No. of Holes |  | 2 |
| `B26` | INPUT | Apply? |  | Process |
| `C26` | INPUT | Apply? |  | Machine / Basis |
| `D26` | INPUT | Apply? |  | Hours / Qty Bas… |
| `E26` | INPUT | Apply? |  | Rate (Rs.) |
| `F26` | INPUT | Apply? |  | Cost (Rs.) |
| `B27` | INPUT | Yes |  | Rough Turning |
| `C27` | INPUT | Yes |  | Manual Entry |
| `D27` | INPUT | Yes |  | Manual |
| `E27` | INPUT | Yes |  | Manual |
| `F27` | INPUT | Yes |  | 0 |
| `B28` | INPUT | Yes |  | Finished Turning |
| `C28` | INPUT | Yes |  | Manual Entry |
| `D28` | INPUT | Yes |  | Manual |
| `E28` | INPUT | Yes |  | Manual |
| `F28` | INPUT | Yes |  | 0 |
| `B29` | INPUT | Yes |  | Pin Grinding |
| `C29` | INPUT | Yes |  | Manual Entry |
| `D29` | INPUT | Yes |  | Manual |
| `E29` | INPUT | Yes |  | Manual |
| `F29` | INPUT | Yes |  | 0 |
| `B30` | INPUT | Yes |  | Milling |
| `C30` | INPUT | Yes |  | Milling Machine |
| `D30` | looked-up | Yes | `VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3 |
| `E30` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F30` | derived | Yes | `IF(A30="Yes",D30*E30,0)` | 105 |
| `B31` | INPUT | Yes |  | Drilling |
| `C31` | INPUT | Yes |  | Drilling Machine |
| `D31` | looked-up | Yes | `VLOOKUP(B22,DrillingTable,3,TRUE())*B23` | 0.1 |
| `E31` | looked-up | Yes | `INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F31` | derived | Yes | `(shared//inherited)` | 25 |
| `B34` | derived | Total Process & Vendor Cost / pc (Rs.) | `F27+F28+F29+F30+F31` | 130 |
| `B37` | INPUT | Additional Cost / pc (Rs.) |  | 0 |
| `B41` | INPUT | Cost Head |  | Rs. / pc |
| `B42` | derived | Material Cost | `B17` | 1067.6 |
| `B43` | derived | Process Cost | `B34` | 130 |
| `B44` | derived | Additional Cost | `B37` | 0 |
| `B45` | derived | TOTAL TRUNNION COST / pc | `B17+B34+B37` | 1197.6 |
| `B46` | derived | TOTAL TRUNNION COST for Qty | `B45*B10` | 2395.2 |

---

## Roll-up sheets

### Bought Out & Seal Kit Master

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `F4` | Seal | `IF(C4="Yes",D4*E4,0)` | 0 |
| `F5` | Bearing | `(shared//inherited)` | 360 |
| `F6` |  | `(shared//inherited)` | 0 |
| `F7` | Check Valve | `(shared//inherited)` | 0 |
| `F8` | Transducer | `(shared//inherited)` | 0 |
| `F9` | Bellows | `(shared//inherited)` | 0 |
| `F10` | Other Component 1 | `(shared//inherited)` | 0 |
| `F11` | Other Component 2 | `(shared//inherited)` | 0 |
| `F12` | Other Component 3 | `(shared//inherited)` | 0 |
| `F13` | Other Component 4 | `(shared//inherited)` | 0 |
| `F14` | Other Component 5 | `(shared//inherited)` | 0 |
| `B16` | TOTAL SEAL KIT COST (Rs.) | `SUMIFS(F4:F14,B4:B14,"Seal Kit",C4:C14,"Yes")` | 0 |
| `B17` | TOTAL BOUGHT OUT COST (Rs.) | `SUMIFS(F4:F14,B4:B14,"Bought Out",C4:C14,"Yes")` | 360 |

### Assembly Painting Packing

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B7` | Assembly Cost (Rs.) | `B5*B6` | 750 |
| `B11` | Painting Rate (Rs./cm2) | `PaintingRate` | 0.2 |
| `B12` | Painting Cost (Rs.) | `B10*B11` | 900 |
| `B17` | Packing Rate (Rs./kg) | `IF(B15="Wooden Box",PackingWoodenRate,PackingLooseRate)` | 15 |
| `B18` | Packing Cost (Rs.) | `B16*B17` | 2250 |
| `B21` | TOTAL ASSEMBLY + PAINTING + PACKING COST (Rs | `B7+B12+B18` | 3900 |

### Reconditioning

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B17` | SUBTOTAL - PROCESS COST | `SUM(B7:B16)` | 0 |
| `D21` | Tube | `B21*C21` | 0 |
| `D22` | Rod | `(shared//inherited)` | 0 |
| `D23` | Gland | `(shared//inherited)` | 0 |
| `D24` | Piston | `(shared//inherited)` | 0 |
| `D25` | Rear Eye / Rod Eye | `(shared//inherited)` | 0 |
| `D26` | Bushes | `(shared//inherited)` | 0 |
| `D27` | Additional Item 1 | `(shared//inherited)` | 0 |
| `D28` | Additional Item 2 | `(shared//inherited)` | 0 |
| `B29` | SUBTOTAL - REPLACEMENT MATERIAL COST | `SUM(D21:D28)` | 0 |
| `B32` | TOTAL RECONDITIONING COST (Rs.) | `B17+B29` | 0 |

### Cost Summary

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B2` | Cylinder Name: | `CylinderName` | Excavator Boom C |
| `B3` | Inquiry No.: | `InquiryNo` | INQ-0001 |
| `B7` | Tube | `Tube_TotalCost` | 4914.416685 |
| `B8` | Piston Rod | `PistonRod_TotalCost` | 7314.242382 |
| `B9` | Cap End Cover | `CEC_TotalCost` | **#N/A** |
| `B10` | Head End Cover | `HEC_TotalCost` | **#N/A** |
| `B11` | Gland | `Gland_TotalCost` | **#N/A** |
| `B12` | Cushion Bush | `CushionBush_TotalCost` | 3798.467346 |
| `B13` | Stop Tube | `StopTube_TotalCost` | **#N/A** |
| `B14` | Rear Eye | `RearEye_TotalCost` | **#N/A** |
| `B15` | Rod Eye | `RodEye_TotalCost` | **#N/A** |
| `B16` | Piston | `Piston_TotalCost` | **#N/A** |
| `B17` | Flange | `Flange_TotalCost` | **#N/A** |
| `B18` | Trunnion | `Trunnion_TotalCost` | 2395.2 |
| `B19` | SUBTOTAL - COMPONENT MANUFACTURING COST | `SUM(B7:B18)` | **#N/A** |
| `B22` | Total Cylinder Weight (Nett, all components) | `IFERROR(Tube_Weight,0)+IFERROR(PistonRod_Weight,0)+IFERROR(CEC_Weight,0)+IFERROR(HEC_Weight,0)+IFERROR(Gland_Weight,0)+IFERROR(CushionBush_Weight,0)+IFERROR(StopTube_Weight,0)+IFERROR(RearEye_Weight,0)+IFERROR(RodEye_Weight,0)+IFERROR(Piston_Weight,0)+IFERROR(Flange_Weight,0)+IFERROR(Trunnion_Weight,0)` | 76.54190031 |
| `B24` | TOTAL CYLINDER WEIGHT (Rs. quoted on, for re | `B22+B23` | 76.54190031 |
| `B27` | Seal Kit Cost | `TotalSealKitCost` | 0 |
| `B28` | Bought Out Items Cost | `TotalBoughtOutCost` | 360 |
| `B29` | Assembly Cost | `AssemblyCost` | 750 |
| `B30` | Painting Cost | `PaintingCost` | 900 |
| `B31` | Packing Cost | `PackingCost` | 2250 |
| `B32` | SUBTOTAL - OTHER COSTS | `SUM(B27:B31)` | 4260 |
| `B35` | Reconditioning Cost | `IF(ReconditioningInclude="Yes",Reconditioning_TotalCost,0)` | 0 |
| `B38` | TOTAL MANUFACTURING COST (Rs.) | `B19+B32+B35` | **#N/A** |

### Final Output

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B1` | ENQ NO  | `InquiryNo` | INQ-0001 |
| `B3` | DATE : | `InquiryDate` | 46248 |
| `B4` | CUSTOMER: | `CustomerName` | Sample Customer  |
| `B5` | CYLINDER TYPE | `CylinderName` | Excavator Boom C |
| `B6` | SPECIFICATION : | `"Bore "&Bore&"mm x Rod "&RodDia&"mm x Stroke "&Stroke&"mm \| "&Mounting&" \| "&WorkingPressure&" bar"` | Bore 100mm x Rod |
| `B8` | WT OF CYLINDER :  | `TotalCylinderWeight` | 76.54190031 |
| `C11` |  | `IFERROR(Tube_MaterialCost,0)+IFERROR(PistonRod_MaterialCost,0)+IFERROR(CEC_MaterialCost,0)+IFERROR(HEC_MaterialCost,0)+IFERROR(Gland_MaterialCost,0)+IFERROR(CushionBush_MaterialCost,0)+IFERROR(StopTube_MaterialCost,0)+IFERROR(RearEye_MaterialCost,0)+IFERROR(RodEye_MaterialCost,0)+IFERROR(Piston_MaterialCost,0)+IFERROR(Flange_MaterialCost,0)+IFERROR(Trunnion_MaterialCost,0)` | 7810.484203 |
| `C12` |  | `IFERROR(Tube_ProcessCost,0)+IFERROR(PistonRod_ProcessCost,0)+IFERROR(CEC_ProcessCost,0)+IFERROR(HEC_ProcessCost,0)+IFERROR(Gland_ProcessCost,0)+IFERROR(CushionBush_ProcessCost,0)+IFERROR(StopTube_ProcessCost,0)+IFERROR(RearEye_ProcessCost,0)+IFERROR(RodEye_ProcessCost,0)+IFERROR(Piston_ProcessCost,0)+IFERROR(Flange_ProcessCost,0)+IFERROR(Trunnion_ProcessCost,0)` | 11784.13203 |
| `C13` |  | `TotalBoughtOutCost` | 360 |
| `C14` |  | `TotalSealKitCost` | 0 |
| `C15` |  | `AssemblyPaintingPackingTotal` | 3900 |
| `C16` |  | `SUM(C11:C15)` | 23854.61623 |

---

## Defined names

Every named range the formulas resolve against.

| Name | Refers to |
|---|---|
| `ActualTotalCost` | `'Actual Cost Tracker'!$B$23` |
| `AssemblyCost` | `'Assembly Painting Packing'!$B$7` |
| `AssemblyPaintingPackingTotal` | `'Assembly Painting Packing'!$B$21` |
| `Bore` | `'Inquiry Input'!$B$8` |
| `BoringIDBins` | `'Machine Time Master'!$A$32:$A$35` |
| `BoringLenBins` | `'Machine Time Master'!$C$31:$F$31` |
| `BoringTable` | `'Machine Time Master'!$C$32:$F$35` |
| `CEC_MaterialCost` | `'Cap End Cover'!$B$43` |
| `CEC_ProcessCost` | `'Cap End Cover'!$B$44` |
| `CEC_TotalCost` | `'Cap End Cover'!$B$47` |
| `CEC_UnitCost` | `'Cap End Cover'!$B$46` |
| `CEC_Weight` | `'Cap End Cover'!$B$19` |
| `ChromePlatingRate` | `'Process Rate Master'!$B$9` |
| `ComponentManufacturingCost` | `'Cost Summary'!$B$19` |
| `CushionBush_MaterialCost` | `'Cushion Bush'!$B$35` |
| `CushionBush_ProcessCost` | `'Cushion Bush'!$B$36` |
| `CushionBush_TotalCost` | `'Cushion Bush'!$B$39` |
| `CushionBush_UnitCost` | `'Cushion Bush'!$B$38` |
| `CushionBush_Weight` | `'Cushion Bush'!$B$16` |
| `CustomerLocation` | `'Inquiry Input'!$B$6` |
| `CustomerName` | `'Inquiry Input'!$B$5` |
| `CuttingLenBins` | `'Machine Time Master'!$C$6:$F$6` |
| `CuttingODBins` | `'Machine Time Master'!$A$7:$A$10` |
| `CuttingTable` | `'Machine Time Master'!$C$7:$F$10` |
| `CylinderName` | `'Inquiry Input'!$B$7` |
| `DechromePlatingRate` | `'Process Rate Master'!$B$10` |
| `DrillingBins` | `'Machine Time Master'!$A$63:$A$66` |
| `DrillingTable` | `'Machine Time Master'!$A$63:$C$66` |
| `FinalOutput_TotalCylinderCost` | `'Final Output'!$C$16` |
| `Flange_MaterialCost` | `Flange!$B$39` |
| `Flange_ProcessCost` | `Flange!$B$40` |
| `Flange_TotalCost` | `Flange!$B$43` |
| `Flange_UnitCost` | `Flange!$B$42` |
| `Flange_Weight` | `Flange!$B$15` |
| `Gland_MaterialCost` | `Gland!$B$41` |
| `Gland_ProcessCost` | `Gland!$B$42` |
| `Gland_TotalCost` | `Gland!$B$45` |
| `Gland_UnitCost` | `Gland!$B$44` |
| `Gland_Weight` | `Gland!$B$16` |
| `GrindingLenBins` | `'Machine Time Master'!$C$48:$E$48` |
| `GrindingODBins` | `'Machine Time Master'!$A$49:$A$52` |
| `GrindingRate` | `'Process Rate Master'!$B$6` |
| `GrindingTimeTable` | `'Machine Time Master'!$C$49:$E$52` |
| `HeatTreatmentRate` | `'Process Rate Master'!$B$4` |
| `HEC_MaterialCost` | `'Head End Cover'!$B$43` |
| `HEC_ProcessCost` | `'Head End Cover'!$B$44` |
| `HEC_TotalCost` | `'Head End Cover'!$B$47` |
| `HEC_UnitCost` | `'Head End Cover'!$B$46` |
| `HEC_Weight` | `'Head End Cover'!$B$19` |
| `HoningIDBins` | `'Machine Time Master'!$A$40:$A$43` |
| `HoningIDThreshold` | `'Process Rate Master'!$B$28` |
| `HoningLenBins` | `'Machine Time Master'!$C$39:$E$39` |
| `HoningLengthThreshold` | `'Process Rate Master'!$B$27` |
| `HoningRateHigh` | `'Process Rate Master'!$B$26` |
| `HoningRateLow` | `'Process Rate Master'!$B$25` |
| `HoningTable` | `'Machine Time Master'!$C$40:$E$43` |
| `InductionHardeningRate` | `'Process Rate Master'!$B$5` |
| `InquiryDate` | `'Inquiry Input'!$B$4` |
| `InquiryNo` | `'Inquiry Input'!$B$3` |
| `JobType` | `'Inquiry Input'!$B$13` |
| `MachineRateMaster_Range` | `'Machine Rate Master'!$A$4:$B$10` |
| `MaterialMaster_Range` | `'Material Master'!$A$4:$D$12` |
| `MillingBins` | `'Machine Time Master'!$A$56:$A$59` |
| `MillingTable` | `'Machine Time Master'!$A$56:$C$59` |
| `Mounting` | `'Inquiry Input'!$B$11` |
| `PackingCost` | `'Assembly Painting Packing'!$B$18` |
| `PackingLooseRate` | `'Process Rate Master'!$B$12` |
| `PackingWoodenRate` | `'Process Rate Master'!$B$13` |
| `PaintingCost` | `'Assembly Painting Packing'!$B$12` |
| `PaintingRate` | `'Process Rate Master'!$B$8` |
| `Piston_MaterialCost` | `Piston!$B$39` |
| `Piston_ProcessCost` | `Piston!$B$40` |
| `Piston_TotalCost` | `Piston!$B$43` |
| `Piston_UnitCost` | `Piston!$B$42` |
| `Piston_Weight` | `Piston!$B$15` |
| `PistonRod_MaterialCost` | `'Piston Rod'!$B$57` |
| `PistonRod_ProcessCost` | `'Piston Rod'!$B$58` |
| `PistonRod_TotalCost` | `'Piston Rod'!$B$61` |
| `PistonRod_UnitCost` | `'Piston Rod'!$B$60` |
| `PistonRod_Weight` | `'Piston Rod'!$B$16` |
| `PolishingRate` | `'Process Rate Master'!$B$7` |
| `ProfileCuttingBins` | `'Machine Time Master'!$A$71:$A$74` |
| `ProfileCuttingRate` | `'Process Rate Master'!$B$11` |
| `ProfileCuttingTimeTable` | `'Machine Time Master'!$A$71:$C$74` |
| `RearEye_MaterialCost` | `'Rear Eye'!$B$38` |
| `RearEye_ProcessCost` | `'Rear Eye'!$B$39` |
| `RearEye_TotalCost` | `'Rear Eye'!$B$42` |
| `RearEye_UnitCost` | `'Rear Eye'!$B$41` |
| `RearEye_Weight` | `'Rear Eye'!$B$17` |
| `Reconditioning_TotalCost` | `Reconditioning!$B$32` |
| `ReconditioningInclude` | `Reconditioning!$B$3` |
| `RodDia` | `'Inquiry Input'!$B$9` |
| `RodEye_MaterialCost` | `'Rod Eye'!$B$40` |
| `RodEye_ProcessCost` | `'Rod Eye'!$B$41` |
| `RodEye_TotalCost` | `'Rod Eye'!$B$44` |
| `RodEye_UnitCost` | `'Rod Eye'!$B$43` |
| `RodEye_Weight` | `'Rod Eye'!$B$19` |
| `RoughTurningTable` | `'Machine Time Master'!$C$15:$F$18` |
| `StockRemovalTable` | `'Machine Time Master'!$A$22:$C$25` |
| `StopTube_MaterialCost` | `'Stop Tube'!$B$33` |
| `StopTube_ProcessCost` | `'Stop Tube'!$B$34` |
| `StopTube_TotalCost` | `'Stop Tube'!$B$37` |
| `StopTube_UnitCost` | `'Stop Tube'!$B$36` |
| `StopTube_Weight` | `'Stop Tube'!$B$16` |
| `Stroke` | `'Inquiry Input'!$B$10` |
| `TotalBoughtOutCost` | `'Bought Out & Seal Kit Master'!$B$17` |
| `TotalCylinderWeight` | `'Cost Summary'!$B$24` |
| `TotalManufacturingCost` | `'Cost Summary'!$B$38` |
| `TotalSealKitCost` | `'Bought Out & Seal Kit Master'!$B$16` |
| `Trunnion_MaterialCost` | `Trunnion!$B$42` |
| `Trunnion_ProcessCost` | `Trunnion!$B$43` |
| `Trunnion_TotalCost` | `Trunnion!$B$46` |
| `Trunnion_UnitCost` | `Trunnion!$B$45` |
| `Trunnion_Weight` | `Trunnion!$B$16` |
| `Tube_MaterialCost` | `Tube!$B$71` |
| `Tube_ProcessCost` | `Tube!$B$72` |
| `Tube_TotalCost` | `Tube!$B$75` |
| `Tube_UnitCost` | `Tube!$B$74` |
| `Tube_Weight` | `Tube!$B$17` |
| `TurningODBins` | `'Machine Time Master'!$A$15:$A$18` |
| `TurningRateTable` | `'Process Rate Master'!$A$19:$D$21` |
| `WeldBeadsHigh` | `'Process Rate Master'!$B$37` |
| `WeldBeadsLow` | `'Process Rate Master'!$B$36` |
| `WeldDepositionRate` | `'Process Rate Master'!$B$33` |
| `WeldDiaThreshold` | `'Process Rate Master'!$B$35` |
| `WeldLabourRate` | `'Process Rate Master'!$B$31` |
| `WeldSpeed` | `'Process Rate Master'!$B$34` |
| `WeldWireRate` | `'Process Rate Master'!$B$32` |
| `WorkingPressure` | `'Inquiry Input'!$B$12` |
