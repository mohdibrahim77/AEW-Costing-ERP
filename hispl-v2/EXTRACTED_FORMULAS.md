# Trunion_Included.xlsx — complete extraction

Every formula with its cell address and cached value, exactly as stored.

Generated mechanically — do not hand-edit.


## Inquiry Input  (1 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B4` | Inquiry Date | `=TODAY()` | 2026-08-14 00:00:00 |

## Tube  (51 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B14` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.8500 |
| `B15` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 68 |
| `B16` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2-(B9)^2)*B10*B14/1000000` | 11.2078 |
| `B17` | Total Weight for Qty (kg) | `=B16*B11` | 11.2078 |
| `B18` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B16*B15)` | 762.1280 |
| `B19` | Total Material Cost for Qty (Rs.) | `=B18*B11` | 762.1280 |
| `D26` | Yes | `=INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B10,CuttingLenBins,1))` | 0.1500 |
| `E26` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | Yes | `=IF(A26="Yes",D26*E26,0)` | 52.5000 |
| `D27` | Yes | `=INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*VLOOKUP((B7-B8),Stoc` | 0.9000 |
| `E27` | Yes | `=VLOOKUP(B8,TurningRateTable,3,TRUE())` | 550 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 495 |
| `D28` | No | `=INDEX(BoringTable,MATCH(B9,BoringIDBins,1),MATCH(B10,BoringLenBins,1))` | 1.2000 |
| `E28` | No | `=INDEX(MachineRateMaster_Range,MATCH("Conventional Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | #N/A |
| `F28` | No | `=IF(A28="Yes",D28*E28,0)` | 0 |
| `D29` | Yes | `=VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.2000 |
| `E29` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | Yes | `=IF(A29="Yes",D29*E29,0)` | 50 |
| `D30` | Yes | `=PI()*B9*B10/100` | 2838.7431 |
| `E30` | Yes | `=IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)` | 0.4000 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 1135.4972 |
| `D31` | Yes | `=INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*0.7` | 0.6300 |
| `E31` | Yes | `=VLOOKUP(B8,TurningRateTable,4,TRUE())` | 550 |
| `F31` | Yes | `=IF(A31="Yes",D31*E31,0)` | 346.5000 |
| `D32` | Yes | `=PI()*B9*B10/100` | 2838.7431 |
| `E32` | Yes | `=IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)` | 0.4000 |
| `F32` | Yes | `=IF(A32="Yes",D32*E32,0)` | 1135.4972 |
| `B37` | No. of Beads (auto) | `=IF(B36<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B38` | Total Weld Length (mm) | `=PI()*B36*B37` | 1696.4600 |
| `B39` | Welding Time (Hr) | `=B38/WeldSpeed` | 0.4712 |
| `B40` | Labour Cost (Rs.) | `=B39*WeldLabourRate` | 176.7146 |
| `B41` | Wire Cost (Rs.) | `=B39*WeldDepositionRate*WeldWireRate` | 135.7168 |
| `B42` | Total Welding Cost (Rs.) | `=B40+B41` | 312.4314 |
| `B46` | No. of Beads (auto) | `=IF(B45<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B47` | Total Weld Length (mm) | `=PI()*B45*B46` | 1696.4600 |
| `B48` | Welding Time (Hr) | `=B47/WeldSpeed` | 0.4712 |
| `B49` | Labour Cost (Rs.) | `=B48*WeldLabourRate` | 176.7146 |
| `B50` | Wire Cost (Rs.) | `=B48*WeldDepositionRate*WeldWireRate` | 135.7168 |
| `B51` | Total Welding Cost (Rs.) | `=B49+B50` | 312.4314 |
| `B55` | No. of Beads (auto) | `=IF(B54<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B56` | Total Weld Length (mm) | `=PI()*B54*B55` | 1696.4600 |
| `B57` | Welding Time (Hr) | `=B56/WeldSpeed` | 0.4712 |
| `B58` | Labour Cost (Rs.) | `=B57*WeldLabourRate` | 176.7146 |
| `B59` | Wire Cost (Rs.) | `=B57*WeldDepositionRate*WeldWireRate` | 135.7168 |
| `B60` | Total Welding Cost (Rs.) | `=B58+B59` | 312.4314 |
| `B63` | Total Process & Vendor Cost / pc (Rs.) | `=F26+F27+F28+F29+F30+F31+F32+B42+B51+B60` | 4152.2887 |
| `B71` | Material Cost | `=B18` | 762.1280 |
| `B72` | Process Cost | `=B63` | 4152.2887 |
| `B73` | Additional Cost | `=B66` | 0 |
| `B74` | TOTAL TUBE COST / pc | `=B18+B63+B66` | 4914.4167 |
| `B75` | TOTAL TUBE COST for Qty | `=B74*B11` | 4914.4167 |

## Piston Rod  (46 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B13` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.8500 |
| `B14` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 92 |
| `B15` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2)*B9*B13/1000000` | 27.2547 |
| `B16` | Total Weight for Qty (kg) | `=B15*B10` | 27.2547 |
| `B17` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B15*B14)` | 2507.4287 |
| `B18` | Total Material Cost for Qty (Rs.) | `=B17*B10` | 2507.4287 |
| `D26` | Yes | `=INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B9,CuttingLenBins,1))` | 0.1500 |
| `E26` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | Yes | `=IF(A26="Yes",D26*E26,0)` | 52.5000 |
| `D27` | Yes | `=INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),Stock` | 1.6200 |
| `E27` | Yes | `=VLOOKUP(B8,TurningRateTable,3,TRUE())` | 300 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 486 |
| `D29` | Yes | `=B15` | 27.2547 |
| `E29` | Yes | `=HeatTreatmentRate` | 12 |
| `F29` | Yes | `=IF(A29="Yes",D29*E29,0)` | 327.0559 |
| `D30` | Yes | `=PI()*B8*B9/100` | 2023.1857 |
| `E30` | Yes | `=InductionHardeningRate` | 0.4500 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 910.4336 |
| `D31` | Yes | `=INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*0.7` | 0.8400 |
| `E31` | Yes | `=VLOOKUP(B8,TurningRateTable,4,TRUE())` | 400 |
| `F31` | Yes | `=IF(A31="Yes",D31*E31,0)` | 336 |
| `D32` | Yes | `=PI()*B8*B9/100` | 2023.1857 |
| `E32` | Yes | `=GrindingRate` | 0.4000 |
| `F32` | Yes | `=IF(A32="Yes",D32*E32,0)` | 809.2743 |
| `D33` | Yes | `=PI()*B8*B9/100` | 2023.1857 |
| `E33` | Yes | `=ChromePlatingRate` | 0.6000 |
| `F33` | Yes | `=IF(A33="Yes",D33*E33,0)` | 1213.9114 |
| `D34` | Yes | `=PI()*B8*B9/100` | 2023.1857 |
| `E34` | Yes | `=PolishingRate` | 0.2000 |
| `F34` | Yes | `=IF(A34="Yes",D34*E34,0)` | 404.6371 |
| `D35` | Yes | `=VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3000 |
| `E35` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F35` | Yes | `=IF(A35="Yes",D35*E35,0)` | 105 |
| `F36` | Yes | `=B22` | 0 |
| `B41` | No. of Beads (auto) | `=IF(B40<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)` | 5 |
| `B42` | Total Weld Length (mm) | `=PI()*B40*B41` | 879.6459 |
| `B43` | Welding Time (Hr) | `=B42/WeldSpeed` | 0.2443 |
| `B44` | Labour Cost (Rs.) | `=B43*WeldLabourRate` | 91.6298 |
| `B45` | Wire Cost (Rs.) | `=B43*WeldDepositionRate*WeldWireRate` | 70.3717 |
| `B46` | Total Welding Cost (Rs.) | `=B44+B45` | 162.0015 |
| `B49` | Total Process & Vendor Cost / pc (Rs.) | `=F26+F27+F29+F30+F31+F32+F33+F34+F35+F36+B46` | 4806.8137 |
| `B57` | Material Cost | `=B17` | 2507.4287 |
| `B58` | Process Cost | `=B49` | 4806.8137 |
| `B59` | Additional Cost | `=B52` | 0 |
| `B60` | TOTAL PISTON ROD COST / pc | `=B17+B49+B52` | 7314.2424 |
| `B61` | TOTAL PISTON ROD COST for Qty | `=B60*B10` | 7314.2424 |

## Cap End Cover  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B16` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B17` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B18` | Unit Weight (kg / pc) | `=IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | #N/A |
| `B19` | Total Weight for Qty (kg) | `=B18*B13` | #N/A |
| `B20` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B18*B17)` | #N/A |
| `B21` | Total Material Cost for Qty (Rs.) | `=B20*B13` | #N/A |
| `D30` | Yes | `=INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))` | 0.8000 |
| `E30` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 440 |
| `D31` | Yes | `=VLOOKUP((B23)*(B24),MillingTable,3,TRUE())` | 0.3000 |
| `E31` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F31` | Yes | `=IF(A31="Yes",D31*E31,0)` | 105 |
| `D32` | No | `=VLOOKUP(B25,DrillingTable,3,TRUE())*B26` | 0.2000 |
| `E32` | No | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F32` | No | `=IF(A32="Yes",D32*E32,0)` | 0 |
| `B35` | Total Process & Vendor Cost / pc (Rs.) | `=F30+F31+F32` | 545 |
| `B43` | Material Cost | `=B20` | #N/A |
| `B44` | Process Cost | `=B35` | 545 |
| `B45` | Additional Cost | `=B38` | 0 |
| `B46` | TOTAL CAP END COVER COST / pc | `=B20+B35+B38` | #N/A |
| `B47` | TOTAL CAP END COVER COST for Qty | `=B46*B13` | #N/A |

## Head End Cover  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B16` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B17` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B18` | Unit Weight (kg / pc) | `=IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | #N/A |
| `B19` | Total Weight for Qty (kg) | `=B18*B13` | #N/A |
| `B20` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B18*B17)` | #N/A |
| `B21` | Total Material Cost for Qty (Rs.) | `=B20*B13` | #N/A |
| `D30` | Yes | `=INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))` | 0.8000 |
| `E30` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 440 |
| `D31` | Yes | `=VLOOKUP((B23)*(B24),MillingTable,3,TRUE())` | 0.3000 |
| `E31` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F31` | Yes | `=IF(A31="Yes",D31*E31,0)` | 105 |
| `D32` | Yes | `=VLOOKUP(B25,DrillingTable,3,TRUE())*B26` | 0.2000 |
| `E32` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F32` | Yes | `=IF(A32="Yes",D32*E32,0)` | 50 |
| `B35` | Total Process & Vendor Cost / pc (Rs.) | `=F30+F31+F32` | 595 |
| `B43` | Material Cost | `=B20` | #N/A |
| `B44` | Process Cost | `=B35` | 595 |
| `B45` | Additional Cost | `=B38` | 0 |
| `B46` | TOTAL HEAD END COVER COST / pc | `=B20+B35+B38` | #N/A |
| `B47` | TOTAL HEAD END COVER COST for Qty | `=B46*B13` | #N/A |

## Gland  (24 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B13` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B14` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B15` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000` | #N/A |
| `B16` | Total Weight for Qty (kg) | `=B15*B10` | #N/A |
| `B17` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B15*B14)` | #N/A |
| `B18` | Total Material Cost for Qty (Rs.) | `=B17*B10` | #N/A |
| `D27` | Yes | `=INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))` | 0.5000 |
| `E27` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 275 |
| `D28` | Yes | `=VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3000 |
| `E28` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F28` | Yes | `=IF(A28="Yes",D28*E28,0)` | 105 |
| `D29` | Yes | `=VLOOKUP(B22,DrillingTable,3,TRUE())*B23` | 0.0600 |
| `E29` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | Yes | `=IF(A29="Yes",D29*E29,0)` | 15 |
| `D30` | Yes | `=PI()*B8*B9/100` | 125.3495 |
| `E30` | Yes | `=GrindingRate` | 0.4000 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 50.1398 |
| `B33` | Total Process & Vendor Cost / pc (Rs.) | `=F27+F28+F29+F30` | 445.1398 |
| `B41` | Material Cost | `=B17` | #N/A |
| `B42` | Process Cost | `=B33` | 445.1398 |
| `B43` | Additional Cost | `=B36` | 0 |
| `B44` | TOTAL GLAND COST / pc | `=B17+B33+B36` | #N/A |
| `B45` | TOTAL GLAND COST for Qty | `=B44*B10` | #N/A |

## Cushion Bush  (18 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B13` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 8.9000 |
| `B14` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 520 |
| `B15` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000` | 6.6795 |
| `B16` | Total Weight for Qty (kg) | `=B15*B10` | 6.6795 |
| `B17` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B15*B14)` | 3473.3275 |
| `B18` | Total Material Cost for Qty (Rs.) | `=B17*B10` | 3473.3275 |
| `D23` | Yes | `=INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))` | 0.5000 |
| `E23` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F23` | Yes | `=IF(A23="Yes",D23*E23,0)` | 275 |
| `D24` | Yes | `=PI()*B8*B9/100` | 125.3495 |
| `E24` | Yes | `=GrindingRate` | 0.4000 |
| `F24` | Yes | `=IF(A24="Yes",D24*E24,0)` | 50.1398 |
| `B27` | Total Process & Vendor Cost / pc (Rs.) | `=F23+F24` | 325.1398 |
| `B35` | Material Cost | `=B17` | 3473.3275 |
| `B36` | Process Cost | `=B27` | 325.1398 |
| `B37` | Additional Cost | `=B30` | 0 |
| `B38` | TOTAL CUSHION BUSH COST / pc | `=B17+B27+B30` | 3798.4673 |
| `B39` | TOTAL CUSHION BUSH COST for Qty | `=B38*B10` | 3798.4673 |

## Stop Tube  (15 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B13` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B14` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B15` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2)*B9*B13/1000000` | #N/A |
| `B16` | Total Weight for Qty (kg) | `=B15*B10` | #N/A |
| `B17` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B15*B14)` | #N/A |
| `B18` | Total Material Cost for Qty (Rs.) | `=B17*B10` | #N/A |
| `D22` | Yes | `=INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),Stock` | 0.3450 |
| `E22` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F22` | Yes | `=IF(A22="Yes",D22*E22,0)` | 189.7500 |
| `B25` | Total Process & Vendor Cost / pc (Rs.) | `=F22` | 189.7500 |
| `B33` | Material Cost | `=B17` | #N/A |
| `B34` | Process Cost | `=B25` | 189.7500 |
| `B35` | Additional Cost | `=B28` | 0 |
| `B36` | TOTAL STOP TUBE COST / pc | `=B17+B25+B28` | #N/A |
| `B37` | TOTAL STOP TUBE COST for Qty | `=B36*B10` | #N/A |

## Rear Eye  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B14` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B15` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B16` | Unit Weight (kg / pc) | `=(B8)*(B9)*(B7)*B14/1000000` | #N/A |
| `B17` | Total Weight for Qty (kg) | `=B16*B11` | #N/A |
| `B18` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B16*B15)` | #N/A |
| `B19` | Total Material Cost for Qty (Rs.) | `=B18*B11` | #N/A |
| `D25` | Yes | `=B16` | #N/A |
| `E25` | Yes | `=ProfileCuttingRate` | 1.2500 |
| `F25` | Yes | `=IF(A25="Yes",D25*E25,0)` | #N/A |
| `D26` | Yes | `=VLOOKUP((B8)*(B9),MillingTable,3,TRUE())` | 1 |
| `E26` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F26` | Yes | `=IF(A26="Yes",D26*E26,0)` | 350 |
| `D27` | Yes | `=VLOOKUP(B10,DrillingTable,3,TRUE())*B21` | 0.1200 |
| `E27` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 30 |
| `B30` | Total Process & Vendor Cost / pc (Rs.) | `=F25+F26+F27` | #N/A |
| `B38` | Material Cost | `=B18` | #N/A |
| `B39` | Process Cost | `=B30` | #N/A |
| `B40` | Additional Cost | `=B33` | 0 |
| `B41` | TOTAL REAR EYE COST / pc | `=B18+B30+B33` | #N/A |
| `B42` | TOTAL REAR EYE COST for Qty | `=B41*B11` | #N/A |

## Rod Eye  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B16` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B17` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B18` | Unit Weight (kg / pc) | `=IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)` | #N/A |
| `B19` | Total Weight for Qty (kg) | `=B18*B13` | #N/A |
| `B20` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B18*B17)` | #N/A |
| `B21` | Total Material Cost for Qty (Rs.) | `=B20*B13` | #N/A |
| `D27` | Yes | `=B18` | #N/A |
| `E27` | Yes | `=ProfileCuttingRate` | 1.2500 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | #N/A |
| `D28` | Yes | `=VLOOKUP((B9)*(B10),MillingTable,3,TRUE())` | 0.6000 |
| `E28` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F28` | Yes | `=IF(A28="Yes",D28*E28,0)` | 210 |
| `D29` | Yes | `=VLOOKUP(B12,DrillingTable,3,TRUE())*B23` | 0.1200 |
| `E29` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F29` | Yes | `=IF(A29="Yes",D29*E29,0)` | 30 |
| `B32` | Total Process & Vendor Cost / pc (Rs.) | `=F27+F28+F29` | #N/A |
| `B40` | Material Cost | `=B20` | #N/A |
| `B41` | Process Cost | `=B32` | #N/A |
| `B42` | Additional Cost | `=B35` | 0 |
| `B43` | TOTAL ROD EYE COST / pc | `=B20+B32+B35` | #N/A |
| `B44` | TOTAL ROD EYE COST for Qty | `=B43*B13` | #N/A |

## Piston  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B12` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B13` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B14` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2)*B8*B12/1000000` | #N/A |
| `B15` | Total Weight for Qty (kg) | `=B14*B9` | #N/A |
| `B16` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B14*B13)` | #N/A |
| `B17` | Total Material Cost for Qty (Rs.) | `=B16*B9` | #N/A |
| `D26` | Yes | `=B14` | #N/A |
| `E26` | Yes | `=ProfileCuttingRate` | 1.2500 |
| `F26` | Yes | `=IF(A26="Yes",D26*E26,0)` | #N/A |
| `D27` | Yes | `=VLOOKUP((B19)*(B20),MillingTable,3,TRUE())` | 0.3000 |
| `E27` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 105 |
| `D28` | Yes | `=VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.1200 |
| `E28` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F28` | Yes | `=IF(A28="Yes",D28*E28,0)` | 30 |
| `B31` | Total Process & Vendor Cost / pc (Rs.) | `=F26+F27+F28` | #N/A |
| `B39` | Material Cost | `=B16` | #N/A |
| `B40` | Process Cost | `=B31` | #N/A |
| `B41` | Additional Cost | `=B34` | 0 |
| `B42` | TOTAL PISTON COST / pc | `=B16+B31+B34` | #N/A |
| `B43` | TOTAL PISTON COST for Qty | `=B42*B9` | #N/A |

## Flange  (21 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B12` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | #N/A |
| `B13` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | #N/A |
| `B14` | Unit Weight (kg / pc) | `=(PI()/4)*((B7)^2)*B8*B12/1000000` | #N/A |
| `B15` | Total Weight for Qty (kg) | `=B14*B9` | #N/A |
| `B16` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B14*B13)` | #N/A |
| `B17` | Total Material Cost for Qty (Rs.) | `=B16*B9` | #N/A |
| `D26` | Yes | `=INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B8,TurningLenBins,1))` | 0.8000 |
| `E26` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)` | 550 |
| `F26` | Yes | `=IF(A26="Yes",D26*E26,0)` | 440 |
| `D27` | Yes | `=VLOOKUP((B19)*(B20),MillingTable,3,TRUE())` | 0.3000 |
| `E27` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F27` | Yes | `=IF(A27="Yes",D27*E27,0)` | 105 |
| `D28` | Yes | `=VLOOKUP(B21,DrillingTable,3,TRUE())*B22` | 0.2000 |
| `E28` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F28` | Yes | `=IF(A28="Yes",D28*E28,0)` | 50 |
| `B31` | Total Process & Vendor Cost / pc (Rs.) | `=F26+F27+F28` | 595 |
| `B39` | Material Cost | `=B16` | #N/A |
| `B40` | Process Cost | `=B31` | 595 |
| `B41` | Additional Cost | `=B34` | 0 |
| `B42` | TOTAL FLANGE COST / pc | `=B16+B31+B34` | #N/A |
| `B43` | TOTAL FLANGE COST for Qty | `=B42*B9` | #N/A |

## Trunnion  (18 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B13` | Density (g/cm3) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)` | 7.8500 |
| `B14` | Material Rate (Rs./kg) | `=INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)` | 68 |
| `B15` | Unit Weight (kg / pc) | `=(B7)*(B8)*(B9)*B13/1000000` | 15.7000 |
| `B16` | Total Weight for Qty (kg) | `=B15*B10` | 31.4000 |
| `B17` | Material Cost / pc (Rs.) | `=IF(B4="No",0,B15*B14)` | 1067.6000 |
| `B18` | Total Material Cost for Qty (Rs.) | `=B17*B10` | 2135.2000 |
| `D30` | Yes | `=VLOOKUP((B20)*(B21),MillingTable,3,TRUE())` | 0.3000 |
| `E30` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 350 |
| `F30` | Yes | `=IF(A30="Yes",D30*E30,0)` | 105 |
| `D31` | Yes | `=VLOOKUP(B22,DrillingTable,3,TRUE())*B23` | 0.1000 |
| `E31` | Yes | `=INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)` | 250 |
| `F31` | Yes | `=IF(A31="Yes",D31*E31,0)` | 25 |
| `B34` | Total Process & Vendor Cost / pc (Rs.) | `=F27+F28+F29+F30+F31` | 130 |
| `B42` | Material Cost | `=B17` | 1067.6000 |
| `B43` | Process Cost | `=B34` | 130 |
| `B44` | Additional Cost | `=B37` | 0 |
| `B45` | TOTAL TRUNNION COST / pc | `=B17+B34+B37` | 1197.6000 |
| `B46` | TOTAL TRUNNION COST for Qty | `=B45*B10` | 2395.2000 |

## Bought Out & Seal Kit Master  (13 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `F4` | Seal | `=IF(C4="Yes",D4*E4,0)` | 0 |
| `F5` | Bearing | `=IF(C5="Yes",D5*E5,0)` | 360 |
| `F6` |  | `=IF(C6="Yes",D6*E6,0)` | 0 |
| `F7` | Check Valve | `=IF(C7="Yes",D7*E7,0)` | 0 |
| `F8` | Transducer | `=IF(C8="Yes",D8*E8,0)` | 0 |
| `F9` | Bellows | `=IF(C9="Yes",D9*E9,0)` | 0 |
| `F10` | Other Component 1 | `=IF(C10="Yes",D10*E10,0)` | 0 |
| `F11` | Other Component 2 | `=IF(C11="Yes",D11*E11,0)` | 0 |
| `F12` | Other Component 3 | `=IF(C12="Yes",D12*E12,0)` | 0 |
| `F13` | Other Component 4 | `=IF(C13="Yes",D13*E13,0)` | 0 |
| `F14` | Other Component 5 | `=IF(C14="Yes",D14*E14,0)` | 0 |
| `B16` | TOTAL SEAL KIT COST (Rs.) | `=SUMIFS(F4:F14,B4:B14,"Seal Kit",C4:C14,"Yes")` | 0 |
| `B17` | TOTAL BOUGHT OUT COST (Rs.) | `=SUMIFS(F4:F14,B4:B14,"Bought Out",C4:C14,"Yes")` | 360 |

## Assembly Painting Packing  (6 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B7` | Assembly Cost (Rs.) | `=B5*B6` | 750 |
| `B11` | Painting Rate (Rs./cm2) | `=PaintingRate` | 0.2000 |
| `B12` | Painting Cost (Rs.) | `=B10*B11` | 900 |
| `B17` | Packing Rate (Rs./kg) | `=IF(B15="Wooden Box",PackingWoodenRate,PackingLooseRate)` | 15 |
| `B18` | Packing Cost (Rs.) | `=B16*B17` | 2250 |
| `B21` | TOTAL ASSEMBLY + PAINTING + PACKING CO | `=B7+B12+B18` | 3900 |

## Reconditioning  (11 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B17` | SUBTOTAL - PROCESS COST | `=SUM(B7:B16)` | 0 |
| `D21` | Tube | `=B21*C21` | 0 |
| `D22` | Rod | `=B22*C22` | 0 |
| `D23` | Gland | `=B23*C23` | 0 |
| `D24` | Piston | `=B24*C24` | 0 |
| `D25` | Rear Eye / Rod Eye | `=B25*C25` | 0 |
| `D26` | Bushes | `=B26*C26` | 0 |
| `D27` | Additional Item 1 | `=B27*C27` | 0 |
| `D28` | Additional Item 2 | `=B28*C28` | 0 |
| `B29` | SUBTOTAL - REPLACEMENT MATERIAL COST | `=SUM(D21:D28)` | 0 |
| `B32` | TOTAL RECONDITIONING COST (Rs.) | `=B17+B29` | 0 |

## Cost Summary  (25 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B2` | Cylinder Name: | `=CylinderName` | Excavator Boom Cylinde |
| `B3` | Inquiry No.: | `=InquiryNo` | INQ-0001 |
| `B7` | Tube | `=Tube_TotalCost` | 4914.4167 |
| `B8` | Piston Rod | `=PistonRod_TotalCost` | 7314.2424 |
| `B9` | Cap End Cover | `=CEC_TotalCost` | #N/A |
| `B10` | Head End Cover | `=HEC_TotalCost` | #N/A |
| `B11` | Gland | `=Gland_TotalCost` | #N/A |
| `B12` | Cushion Bush | `=CushionBush_TotalCost` | 3798.4673 |
| `B13` | Stop Tube | `=StopTube_TotalCost` | #N/A |
| `B14` | Rear Eye | `=RearEye_TotalCost` | #N/A |
| `B15` | Rod Eye | `=RodEye_TotalCost` | #N/A |
| `B16` | Piston | `=Piston_TotalCost` | #N/A |
| `B17` | Flange | `=Flange_TotalCost` | #N/A |
| `B18` | Trunnion | `=Trunnion_TotalCost` | 2395.2000 |
| `B19` | SUBTOTAL - COMPONENT MANUFACTURING COS | `=SUM(B7:B18)` | #N/A |
| `B22` | Total Cylinder Weight (Nett, all compo | `=IFERROR(Tube_Weight,0)+IFERROR(PistonRod_Weight,0)+IFERROR(CEC_Weight,0)+IFERROR(HEC_Weight,0)+IFER` | 76.5419 |
| `B24` | TOTAL CYLINDER WEIGHT (Rs. quoted on,  | `=B22+B23` | 76.5419 |
| `B27` | Seal Kit Cost | `=TotalSealKitCost` | 0 |
| `B28` | Bought Out Items Cost | `=TotalBoughtOutCost` | 360 |
| `B29` | Assembly Cost | `=AssemblyCost` | 750 |
| `B30` | Painting Cost | `=PaintingCost` | 900 |
| `B31` | Packing Cost | `=PackingCost` | 2250 |
| `B32` | SUBTOTAL - OTHER COSTS | `=SUM(B27:B31)` | 4260 |
| `B35` | Reconditioning Cost | `=IF(ReconditioningInclude="Yes",Reconditioning_TotalCost,0)` | 0 |
| `B38` | TOTAL MANUFACTURING COST (Rs.) | `=B19+B32+B35` | #N/A |

## Actual Cost Tracker  (58 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B5` | Tube | `=Tube_MaterialCost` | 762.1280 |
| `D5` | Tube | `=Tube_ProcessCost` | 4152.2887 |
| `F5` | Tube | `=(C5+E5)-(B5+D5)` | -4914.4167 |
| `G5` | Tube | `=IF((B5+D5)=0,0,F5/(B5+D5))` | -1 |
| `B6` | Piston Rod | `=PistonRod_MaterialCost` | 2507.4287 |
| `D6` | Piston Rod | `=PistonRod_ProcessCost` | 4806.8137 |
| `F6` | Piston Rod | `=(C6+E6)-(B6+D6)` | -7314.2424 |
| `G6` | Piston Rod | `=IF((B6+D6)=0,0,F6/(B6+D6))` | -1 |
| `B7` | Cap End Cover | `=CEC_MaterialCost` | #N/A |
| `D7` | Cap End Cover | `=CEC_ProcessCost` | 545 |
| `F7` | Cap End Cover | `=(C7+E7)-(B7+D7)` | #N/A |
| `G7` | Cap End Cover | `=IF((B7+D7)=0,0,F7/(B7+D7))` | #N/A |
| `B8` | Head End Cover | `=HEC_MaterialCost` | #N/A |
| `D8` | Head End Cover | `=HEC_ProcessCost` | 595 |
| `F8` | Head End Cover | `=(C8+E8)-(B8+D8)` | #N/A |
| `G8` | Head End Cover | `=IF((B8+D8)=0,0,F8/(B8+D8))` | #N/A |
| `B9` | Gland | `=Gland_MaterialCost` | #N/A |
| `D9` | Gland | `=Gland_ProcessCost` | 445.1398 |
| `F9` | Gland | `=(C9+E9)-(B9+D9)` | #N/A |
| `G9` | Gland | `=IF((B9+D9)=0,0,F9/(B9+D9))` | #N/A |
| `B10` | Cushion Bush | `=CushionBush_MaterialCost` | 3473.3275 |
| `D10` | Cushion Bush | `=CushionBush_ProcessCost` | 325.1398 |
| `F10` | Cushion Bush | `=(C10+E10)-(B10+D10)` | -3798.4673 |
| `G10` | Cushion Bush | `=IF((B10+D10)=0,0,F10/(B10+D10))` | -1 |
| `B11` | Stop Tube | `=StopTube_MaterialCost` | #N/A |
| `D11` | Stop Tube | `=StopTube_ProcessCost` | 189.7500 |
| `F11` | Stop Tube | `=(C11+E11)-(B11+D11)` | #N/A |
| `G11` | Stop Tube | `=IF((B11+D11)=0,0,F11/(B11+D11))` | #N/A |
| `B12` | Rear Eye | `=RearEye_MaterialCost` | #N/A |
| `D12` | Rear Eye | `=RearEye_ProcessCost` | #N/A |
| `F12` | Rear Eye | `=(C12+E12)-(B12+D12)` | #N/A |
| `G12` | Rear Eye | `=IF((B12+D12)=0,0,F12/(B12+D12))` | #N/A |
| `B13` | Rod Eye | `=RodEye_MaterialCost` | #N/A |
| `D13` | Rod Eye | `=RodEye_ProcessCost` | #N/A |
| `F13` | Rod Eye | `=(C13+E13)-(B13+D13)` | #N/A |
| `G13` | Rod Eye | `=IF((B13+D13)=0,0,F13/(B13+D13))` | #N/A |
| `B14` | Piston | `=Piston_MaterialCost` | #N/A |
| `D14` | Piston | `=Piston_ProcessCost` | #N/A |
| `F14` | Piston | `=(C14+E14)-(B14+D14)` | #N/A |
| `G14` | Piston | `=IF((B14+D14)=0,0,F14/(B14+D14))` | #N/A |
| `B15` | Flange | `=Flange_MaterialCost` | #N/A |
| `D15` | Flange | `=Flange_ProcessCost` | 595 |
| `F15` | Flange | `=(C15+E15)-(B15+D15)` | #N/A |
| `G15` | Flange | `=IF((B15+D15)=0,0,F15/(B15+D15))` | #N/A |
| `B16` | Trunnion | `=Trunnion_MaterialCost` | 1067.6000 |
| `D16` | Trunnion | `=Trunnion_ProcessCost` | 130 |
| `F16` | Trunnion | `=(C16+E16)-(B16+D16)` | -1197.6000 |
| `G16` | Trunnion | `=IF((B16+D16)=0,0,F16/(B16+D16))` | -1 |
| `B17` | TOTAL | `=SUM(B5:B16)` | #N/A |
| `C17` | TOTAL | `=SUM(C5:C16)` | 0 |
| `D17` | TOTAL | `=SUM(D5:D16)` | #N/A |
| `E17` | TOTAL | `=SUM(E5:E16)` | 0 |
| `F17` | TOTAL | `=SUM(F5:F16)` | #N/A |
| `G17` | TOTAL | `=IF(SUM(B5:B16,D5:D16)=0,0,F17/SUM(B5:B16,D5:D16))` | #N/A |
| `B23` | Actual Total Manufacturing Cost (Rs.) | `=C17+E17+B20+B21+B22` | 0 |
| `B24` | Estimated Total Manufacturing Cost (Rs | `=TotalManufacturingCost` | #N/A |
| `B25` | Overall Variance Rs. | `=B23-B24` | #N/A |
| `B26` | Overall Variance % | `=IF(B24=0,0,(B23-B24)/B24)` | #N/A |

## Cylinder Database  (12 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `A5` |  | `=CONCATENATE("CYL-",TEXT(InquiryDate,"YYYYMMDD"))` | CYL-20260814 |
| `B5` | CYL-20260814 | `=InquiryNo` | INQ-0001 |
| `C5` | CYL-20260814 | `=CustomerName` | Sample Customer Pvt Lt |
| `D5` | CYL-20260814 | `=CylinderName` | Excavator Boom Cylinde |
| `E5` | CYL-20260814 | `=Bore` | 100 |
| `F5` | CYL-20260814 | `=RodDia` | 56 |
| `G5` | CYL-20260814 | `=Stroke` | 800 |
| `H5` | CYL-20260814 | `=Mounting` | Clevis |
| `I5` | CYL-20260814 | `=TotalManufacturingCost` | #N/A |
| `K5` | CYL-20260814 | `=IFERROR(ActualTotalCost,0)` | 0 |
| `L5` | CYL-20260814 | `=IF(J5=0,0,(J5-I5)/J5)` | 0 |
| `M5` | CYL-20260814 | `=InquiryDate` | 2026-08-14 00:00:00 |

## Final Output  (12 formulas)

| Cell | Label | Formula | Cached |
|---|---|---|---|
| `B1` | ENQ NO  | `=InquiryNo` | INQ-0001 |
| `B3` | DATE : | `=InquiryDate` | 2026-08-14 00:00:00 |
| `B4` | CUSTOMER: | `=CustomerName` | Sample Customer Pvt Lt |
| `B5` | CYLINDER TYPE | `=CylinderName` | Excavator Boom Cylinde |
| `B6` | SPECIFICATION : | `="Bore "&Bore&"mm x Rod "&RodDia&"mm x Stroke "&Stroke&"mm \| "&Mounting&" \| "&WorkingPressure&" ba` | Bore 100mm x Rod 56mm  |
| `B8` | WT OF CYLINDER :  | `=TotalCylinderWeight` | 76.5419 |
| `C11` | 1.0 | `=IFERROR(Tube_MaterialCost,0)+IFERROR(PistonRod_MaterialCost,0)+IFERROR(CEC_MaterialCost,0)+IFERROR(` | 7810.4842 |
| `C12` | 2.0 | `=IFERROR(Tube_ProcessCost,0)+IFERROR(PistonRod_ProcessCost,0)+IFERROR(CEC_ProcessCost,0)+IFERROR(HEC` | 11784.1320 |
| `C13` | 3.0 | `=TotalBoughtOutCost` | 360 |
| `C14` | 5.0 | `=TotalSealKitCost` | 0 |
| `C15` | 6.0 | `=AssemblyPaintingPackingTotal` | 3900 |
| `C16` |  | `=SUM(C11:C15)` | 23854.6162 |