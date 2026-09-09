## Inquiry Input  (8 formulas)
B22     = IF(Mounting_TieRod="Yes",B21,"N/A - not applicable for current Mounting")   -> "N/A - not applicable for current Mounting"
B53     = B20   -> "Rod Eye + Trunnion"
B54     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),2)   -> "Yes"
B55     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),3)   -> "Yes"
B56     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),4)   -> "No"
B57     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),5)   -> "No"
B58     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),6)   -> "No"
B59     = INDEX($A$45:$G$51,MATCH($B$20,$A$45:$A$51,0),7)   -> "No"

## Tube  (55 formulas)
B8      = TubeOD   -> 150
B9      = Bore   -> 125
H9      = B9+TubeBoringAllowance   -> 130
H10     = IF(H9>=B7,"CHECK RAW OD","")   -> ""
H11     = IF(B10<Stroke,"CHECK TUBE LENGTH (shorter than Stroke)","")   -> ""
B14     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B15     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)   -> 160
B16     = (PI()/4)*((B7)^2-(H9)^2)*B10*B14/1000000   -> 39.52159883
B17     = B16*B11   -> 39.52159883
B18     = IF(B4="No",0,B16*B15)   -> 6323.455813
B19     = B18*B11   -> 6323.455813
D26     = INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B10,CuttingLenBins,1))   -> 0.15
E26     = INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F26     = IF(A26="Yes",D26*E26,0)   -> 52.5
D27     = INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())   -> 0.8
E27     = VLOOKUP(B8,TurningRateTable,3,TRUE())   -> 550
F27     = (shared//inherited)   -> 440
D28     = INDEX(BoringTable,MATCH(B9,BoringIDBins,1),MATCH(B10,BoringLenBins,1))   -> 0.7
E28     = INDEX(MachineRateMaster_Range,MATCH("Conventional Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 500
F28     = (shared//inherited)   -> 350
D29     = VLOOKUP(B21,DrillingTable,3,TRUE())*B22   -> 0.06
E29     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F29     = (shared//inherited)   -> 21
D30     = PI()*B9*B10/100   -> 1452.986602
E30     = IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)   -> 0.4
F30     = (shared//inherited)   -> 581.1946409
D31     = INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B10,TurningLenBins,1))*0.7   -> 0.35
E31     = VLOOKUP(B8,TurningRateTable,4,TRUE())   -> 550
F31     = (shared//inherited)   -> 192.5
D32     = PI()*B9*B10/100   -> 1452.986602
E32     = IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)   -> 0.4
F32     = (shared//inherited)   -> 581.1946409
B36     = Tube_OD   -> 150
B37     = VLOOKUP(B36,WeldBeadTable,3,TRUE())   -> 5
B39     = (B36*3.14)/25.4   -> 18.54330709
B40     = WeldRatePerInchBead   -> 14
B41     = B39*WeldDepositionRate*WeldWireRate   -> 5340.472441
B42     = B39*B40*B37*B38   -> 1298.031496
B45     = Tube_OD   -> 150
B46     = VLOOKUP(B45,WeldBeadTable,3,TRUE())   -> 5
B48     = (B45*3.14)/25.4   -> 18.54330709
B49     = WeldRatePerInchBead   -> 14
B51     = B48*B49*B46*B47   -> 1298.031496
B54     = Tube_OD   -> 150
B55     = VLOOKUP(B54,WeldBeadTable,3,TRUE())   -> 5
B57     = (B54*3.14)/25.4   -> 18.54330709
B58     = WeldRatePerInchBead   -> 14
B59     = B57*WeldDepositionRate*WeldWireRate   -> 5340.472441
B60     = B57*B58*B55*B56   -> 1298.031496
B63     = F26+F27+F28+F29+F30+F31+F32+B42+B51+B60   -> 6112.48377
B71     = B18   -> 6323.455813
B72     = B63   -> 6112.48377
B73     = B66   -> 0
B74     = IF(H10="CHECK RAW OD","INVALID - FIX RAW OD (see H10 warning above)",B18+B63+B66)   -> 12435.93958
B75     = IF(H10="CHECK RAW OD","INVALID - FIX RAW OD",B74*B11)   -> 12435.93958

## Piston Rod  (52 formulas)
H7      = IF(B8>=B7,"CHECK RAW DIAMETER","")   -> ""
B8      = RodDia   -> 90
B13     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B14     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)   -> 100
B15     = (PI()/4)*((B7)^2)*B9*B13/1000000   -> 33.94193393
B16     = B15*B10   -> 33.94193393
B17     = IF(B4="No",0,B15*B14)   -> 3394.193393
B18     = B17*B10   -> 3394.193393
B23     = PRProcessSelection   -> "Toughening and Induction Hardening"
D26     = INDEX(CuttingTable,MATCH(B7,CuttingODBins,1),MATCH(B9,CuttingLenBins,1))   -> 0.15
E26     = INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F26     = IF(A26="Yes",D26*E26,0)   -> 52.5
D27     = INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())   -> 1.035
E27     = VLOOKUP(B8,TurningRateTable,3,TRUE())   -> 300
F27     = (shared//inherited)   -> 310.5
A29     = IF($B$23="Toughening and Induction Hardening","Yes","No")   -> "Yes"
D29     = B15   -> 33.94193393
E29     = HeatTreatmentRate   -> 12
F29     = IF(A29="Yes",D29*E29,0)   -> 407.3032071
H29     = B9   -> 610
A30     = IF(OR($B$23="Toughening and Induction Hardening",$B$23="Only Induction Hardening"),"Yes","No")   -> "Yes"
D30     = PI()*B8*H29/100   -> 1724.734367
E30     = InductionHardeningRate   -> 0.45
F30     = (shared//inherited)   -> 776.1304651
D31     = INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*0.7   -> 0.63
E31     = VLOOKUP(B8,TurningRateTable,4,TRUE())   -> 400
F31     = (shared//inherited)   -> 252
D32     = PI()*B8*B9/100   -> 1724.734367
E32     = GrindingRate   -> 0.4
F32     = (shared//inherited)   -> 689.8937467
D33     = PI()*B8*B9/100   -> 1724.734367
E33     = ChromePlatingRate   -> 0.6
F33     = (shared//inherited)   -> 1034.84062
D34     = PI()*B8*B9/100   -> 1724.734367
E34     = PolishingRate   -> 0.2
F34     = (shared//inherited)   -> 344.9468734
D35     = VLOOKUP((B20)*(B21),MillingTable,3,TRUE())   -> 0.3
E35     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F35     = (shared//inherited)   -> 105
A36     = IF($B$23="Only Deep Hole Drilling","Yes","No")   -> "No"
F36     = B22   -> 0
B40     = PistonRod_OD   -> 90
B41     = IFERROR(VLOOKUP(B40,WeldBeadTable,3,TRUE()),INDEX(WeldBeadTable,1,3))   -> 4
B43     = (B40*3.14)/25.4   -> 11.12598425
B44     = WeldRatePerInchBead   -> 14
B46     = IF(Mounting_RodEye="Yes",B43*B44*B41*B42,0)   -> 623.0551181
B49     = F26+F27+F29+F30+F31+F32+F33+F34+F35+F36+B46   -> 4596.17003
B57     = B17   -> 3394.193393
B58     = B49   -> 4596.17003
B59     = B52   -> 0
B60     = B17+B49+B52   -> 7990.363423
B61     = B60*B10   -> 7990.363423

## Seal Master  (7 formulas)
B34     = Bore   -> 125
B35     = SealBrand   -> "Freudenberg"
B36     = SealMaterial   -> "Viton"
B37     = SealType   -> "Normal Glide Ring"
B39     = IF(OR(B34<A9,B34>A30),"ENTER THE SEAL SIZE MANUALLY",IF(B37="Chevron","PRICE NOT AVAILABLE - Chevron not in source catalogue",IF(AND(B35="Freudenberg",B36="PU"),"PRICE NOT AVAILABLE - Freudenberg+PU not in source catalogue",IF(AND(B35="Others",B36="PU"),IFERROR(VLOOKUP(B34,SealMasterTable_Range,3,TRUE()),"PRICE NOT AVAILABLE"),IF(AND(B35="Others",B36="Viton"),IFERROR(VLOOKUP(B34,SealMasterTable_Range,4,TRUE()),"PRICE NOT AVAILABLE"),IF(AND(B35="Freudenberg",B36="Viton"),IFERROR(VLOOKUP(B34,SealMasterTable_Range,5,TRUE()),"PRICE NOT AVAILABLE"),"PRICE NOT AVAILABLE"))))))   -> 9750.4
B41     = IF(ISNUMBER(B39),B39*(1+B40),B39)   -> 12188
A43     = IF(OR(Bore<A9,Bore>A30),"⚠ ENTER THE SEAL SIZE MANUALLY - Bore "&Bore&"mm is outside the priced range ("&A9&"-"&A30&"mm)","")   -> ""

## Cap End Cover  (31 formulas)
B8      = CEC_Dia   -> 168
B9      = CEC_Width   -> 165
B10     = CEC_Height   -> 165
B11     = CEC_Thickness   -> 44
B12     = CEC_FinishedOD   -> 165
B16     = INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B17     = IF(B7="MS-C45",IFERROR(VLOOKUP(CEC_Thickness,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B18     = IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)   -> 7.65650866
B19     = B18*B13   -> 7.65650866
B20     = IF(B4="No",0,B18*B17)   -> 765.650866
B21     = B20*B13   -> 765.650866
D30     = INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))   -> 0.8
E30     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F30     = IF(A30="Yes",D30*E30,0)   -> 440
D31     = VLOOKUP((B23)*(B24),MillingTable,3,TRUE())   -> 0.3
E31     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F31     = (shared//inherited)   -> 105
D32     = VLOOKUP(B25,DrillingTable,3,TRUE())*B26   -> 0.2
E32     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F32     = (shared//inherited)   -> 70
H33     = IF(G30="",IFERROR(VLOOKUP(Bore,CECGeomTable,2,TRUE()),0),G30)   -> 168
H34     = IF(H30="",IFERROR(VLOOKUP(Bore,CECGeomTable,3,TRUE()),0),H30)   -> 165
B35     = F30+F31+F32   -> 615
H35     = IF(I30="",IFERROR(VLOOKUP(Bore,CECGeomTable,4,TRUE()),0),I30)   -> 165
H36     = IF(J30="",IFERROR(VLOOKUP(Bore,CECGeomTable,5,TRUE()),0),J30)   -> 44
H37     = IF(K30="",IFERROR(VLOOKUP(Bore,CECGeomTable,6,TRUE()),0),K30)   -> 165
B43     = B20   -> 765.650866
B44     = B35   -> 615
B45     = B38   -> 0
B46     = B20+B35+B38   -> 1380.650866
B47     = B46*B13   -> 1380.650866

## Head End Cover  (31 formulas)
B8      = HEC_Dia   -> 168
B9      = HEC_Width   -> 165
B10     = HEC_Height   -> 165
B11     = HEC_Thickness   -> 44
B12     = HEC_FinishedOD   -> 165
B16     = INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B17     = IF(B7="MS-C45",IFERROR(VLOOKUP(HEC_Thickness,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B18     = IF(B5="Round",(PI()/4)*(B8)^2*B11*B16/1000000,(B9)*(B10)*B11*B16/1000000)   -> 7.65650866
B19     = B18*B13   -> 7.65650866
B20     = IF(B4="No",0,B18*B17)   -> 765.650866
B21     = B20*B13   -> 765.650866
D30     = INDEX(RoughTurningTable,MATCH(B12,TurningODBins,1),MATCH(B11,TurningLenBins,1))   -> 0.8
E30     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F30     = IF(A30="Yes",D30*E30,0)   -> 440
D31     = VLOOKUP((B23)*(B24),MillingTable,3,TRUE())   -> 0.3
E31     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F31     = (shared//inherited)   -> 105
D32     = VLOOKUP(B25,DrillingTable,3,TRUE())*B26   -> 0.2
E32     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F32     = (shared//inherited)   -> 70
H33     = IF(G30="",IFERROR(VLOOKUP(Bore,HECGeomTable,2,TRUE()),0),G30)   -> 168
H34     = IF(H30="",IFERROR(VLOOKUP(Bore,HECGeomTable,3,TRUE()),0),H30)   -> 165
B35     = F30+F31+F32   -> 615
H35     = IF(I30="",IFERROR(VLOOKUP(Bore,HECGeomTable,4,TRUE()),0),I30)   -> 165
H36     = IF(J30="",IFERROR(VLOOKUP(Bore,HECGeomTable,5,TRUE()),0),J30)   -> 44
H37     = IF(K30="",IFERROR(VLOOKUP(Bore,HECGeomTable,6,TRUE()),0),K30)   -> 165
B43     = B20   -> 765.650866
B44     = B35   -> 615
B45     = B38   -> 0
B46     = B20+B35+B38   -> 1380.650866
B47     = B46*B13   -> 1380.650866

## Cushion Bush  (24 formulas)
B7      = CushionBush_OD   -> 126
B8      = CushionBush_ID   -> 91
B9      = CushionBush_Length   -> 72
B13     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 8.9
B14     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)   -> 1800
B15     = (PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000   -> 3.822435472
B16     = B15*B10   -> 3.822435472
B17     = IF(B4="No",0,B15*B14)   -> 6880.383849
B18     = B17*B10   -> 6880.383849
D23     = INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))   -> 0.5
E23     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F23     = IF(A23="Yes",D23*E23,0)   -> 275
D24     = PI()*B8*B9/100   -> 205.8371507
E24     = GrindingRate   -> 0.4
F24     = (shared//inherited)   -> 82.33486027
B27     = F23+F24   -> 357.3348603
H30     = IF(G27="",IFERROR(VLOOKUP(RodDia,CushionBushGeomTable,2,TRUE()),0),G27)   -> 126
H31     = IF(H27="",IFERROR(VLOOKUP(RodDia,CushionBushGeomTable,3,TRUE()),0),H27)   -> 91
H32     = IF(I27="",IFERROR(VLOOKUP(RodDia,CushionBushGeomTable,4,TRUE()),0),I27)   -> 72
B35     = B17   -> 6880.383849
B36     = B27   -> 357.3348603
B37     = B30   -> 0
B38     = B17+B27+B30   -> 7237.71871
B39     = B38*B10   -> 7237.71871

## Stop Tube  (20 formulas)
B7      = StopTube_RawDia   -> 122
H7      = IF(B8>=B7,"CHECK RAW DIAMETER","")   -> ""
B8      = StopTube_FinishedDia   -> 113
B13     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B14     = IF(B6="MS-EN8",VLOOKUP(StopTube_FinishedDia,EN8RateTable,3,TRUE()),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 75
B15     = (PI()/4)*((B7)^2)*B9*B13/1000000   -> 13.76481753
B16     = B15*B10   -> 13.76481753
B17     = IF(B4="No",0,B15*B14)   -> 1032.361314
B18     = B17*B10   -> 1032.361314
D22     = INDEX(RoughTurningTable,MATCH(B8,TurningODBins,1),MATCH(B9,TurningLenBins,1))*VLOOKUP((B7-B8),StockRemovalTable,3,TRUE())   -> 0.675
E22     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F22     = IF(A22="Yes",D22*E22,0)   -> 371.25
B25     = F22   -> 371.25
H30     = IF(G27="",IFERROR(VLOOKUP(RodDia,StopTubeGeomTable,2,TRUE()),0),G27)   -> 122
H31     = IF(H27="",IFERROR(VLOOKUP(RodDia,StopTubeGeomTable,3,TRUE()),0),H27)   -> 113
B33     = B17   -> 1032.361314
B34     = B25   -> 371.25
B35     = B28   -> 0
B36     = IF(H4="No",0,B17+B25+B28)   -> 1403.611314
B37     = IF(H4="No",0,B36*B10)   -> 1403.611314

## Rear Eye  (29 formulas)
B7      = RearEye_Thickness   -> 23
B8      = RearEye_Width   -> 75
B9      = RearEye_Height   -> 90
B10     = RearEye_PinHole   -> 38
B14     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B15     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)   -> 85
B16     = (B8)*(B9)*(B7)*B14/1000000   -> 1.2187125
B17     = B16*B11   -> 1.2187125
B18     = IF(B4="No",0,B16*B15)   -> 103.5905625
B19     = B18*B11   -> 103.5905625
D25     = B16   -> 1.2187125
E25     = ProfileCuttingRate   -> 1.25
F25     = IF(A25="Yes",D25*E25,0)   -> 1.523390625
D26     = VLOOKUP((B8)*(B9),MillingTable,3,TRUE())   -> 0.3
E26     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F26     = (shared//inherited)   -> 105
D27     = VLOOKUP(B10,DrillingTable,3,TRUE())*B21   -> 0.12
E27     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F27     = (shared//inherited)   -> 42
B30     = F25+F26+F27   -> 148.5233906
H33     = IF(G30="",IFERROR(VLOOKUP(TubeOD,RearEyeGeomTable,2,TRUE()),0),G30)   -> 23
H34     = IF(H30="",IFERROR(VLOOKUP(TubeOD,RearEyeGeomTable,3,TRUE()),0),H30)   -> 75
H35     = IF(I30="",IFERROR(VLOOKUP(TubeOD,RearEyeGeomTable,4,TRUE()),0),I30)   -> 90
H36     = IF(J30="",IFERROR(VLOOKUP(TubeOD,RearEyeGeomTable,5,TRUE()),0),J30)   -> 38
B38     = B18   -> 103.5905625
B39     = B30   -> 148.5233906
B40     = B33   -> 0
B41     = B18+B30+B33   -> 252.1139531
B42     = B41*B11   -> 252.1139531

## Piston  (25 formulas)
B7      = Piston_OD   -> 125
B8      = Piston_Length   -> 75
B12     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B13     = IF(B6="MS-EN8",VLOOKUP(Piston_OD,EN8RateTable,3,TRUE()),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 75
B14     = (PI()/4)*((B7)^2)*B8*B12/1000000   -> 7.225049511
B15     = B14*B9   -> 7.225049511
B16     = IF(B4="No",0,B14*B13)   -> 541.8787133
B17     = B16*B9   -> 541.8787133
H23     = IF(G20="",IFERROR(VLOOKUP(Bore,PistonGeomTable,2,TRUE()),0),G20)   -> 125
H24     = IF(H20="",IFERROR(VLOOKUP(Bore,PistonGeomTable,3,TRUE()),0),H20)   -> 75
D26     = B14   -> 7.225049511
E26     = ProfileCuttingRate   -> 1.25
F26     = IF(A26="Yes",D26*E26,0)   -> 9.031311889
D27     = VLOOKUP((B19)*(B20),MillingTable,3,TRUE())   -> 0.3
E27     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F27     = (shared//inherited)   -> 105
D28     = VLOOKUP(B21,DrillingTable,3,TRUE())*B22   -> 0.12
E28     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F28     = (shared//inherited)   -> 42
B31     = F26+F27+F28   -> 156.0313119
B39     = B16   -> 541.8787133
B40     = B31   -> 156.0313119
B41     = B34   -> 0
B42     = B16+B31+B34   -> 697.9100252
B43     = B42*B9   -> 697.9100252

## Rod Eye  (29 formulas)
B8      = F23   -> 162
B11     = F24   -> 45
B12     = (shared//inherited)   -> 36.5
B16     = INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B17     = INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4)   -> 85
B18     = (PI()/4)*((B8)^2-(B22)^2)*B11*B16/1000000   -> 6.921620552
B19     = B18*B13   -> 6.921620552
B20     = IF(B4="No",0,B18*B17)   -> 588.3377469
B21     = B20*B13   -> 588.3377469
B22     = F22   -> 36
F22     = IF(E19="",IFERROR(VLOOKUP(RodDia,RodEyeGeomTable,2,TRUE()),0),E19)   -> 36
F23     = IF(F19="",IFERROR(VLOOKUP(RodDia,RodEyeGeomTable,3,TRUE()),0),F19)   -> 162
F24     = IF(G19="",IFERROR(VLOOKUP(RodDia,RodEyeGeomTable,4,TRUE()),0),G19)   -> 45
F25     = IF(H19="",IFERROR(VLOOKUP(RodDia,RodEyeGeomTable,5,TRUE()),0),H19)   -> 36.5
D27     = B18   -> 6.921620552
E27     = ProfileCuttingRate   -> 1.25
F27     = IF(A27="Yes",D27*E27,0)   -> 8.65202569
D28     = VLOOKUP((B9)*(B10),MillingTable,3,TRUE())   -> 0.6
E28     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F28     = (shared//inherited)   -> 210
D29     = VLOOKUP(B12,DrillingTable,3,TRUE())*B23   -> 0.12
E29     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F29     = (shared//inherited)   -> 42
B32     = F27+F28+F29   -> 260.6520257
B40     = B20   -> 588.3377469
B41     = B32   -> 260.6520257
B42     = B35   -> 0
B43     = B20+B32+B35   -> 848.9897726
B44     = B43*B13   -> 848.9897726

## CEC Clevis  (41 formulas)
B8      = Bore   -> 125
B9      = F26   -> 110
B10     = F22   -> 100
B11     = F25   -> 50
B12     = F23   -> 50
B13     = (shared//inherited)   -> 50.5
B18     = INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B19     = IF(B7="MS-C45",IFERROR(VLOOKUP(F25,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B7,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B20     = B9*B10*B11   -> 550000
B21     = (PI()/4)*(B13)^2*B11   -> 100148.0833
B22     = B20-B21   -> 449851.9167
F22     = IF(E19="",IFERROR(VLOOKUP(Bore,CECClevisGeomTable,2,TRUE()),0),E19)   -> 100
B23     = B22*B14   -> 899703.8334
F23     = IF(F19="",IFERROR(VLOOKUP(Bore,CECClevisGeomTable,3,TRUE()),0),F19)   -> 50
B24     = B23*B18/1000000   -> 7.062675092
F24     = IF(G19="",IFERROR(VLOOKUP(Bore,CECClevisGeomTable,4,TRUE()),0),G19)   -> 50.5
B25     = IF(B5="No",0,B24*B19)   -> 706.2675092
F25     = IF(H19="",IFERROR(VLOOKUP(Bore,CECClevisGeomTable,5,TRUE()),0),H19)   -> 50
F26     = IF(I19="",IFERROR(VLOOKUP(Bore,CECClevisGeomTable,6,TRUE()),0),I19)   -> 110
B28     = B51   -> 302.8283439
B32     = B59   -> 1298.031496
B38     = B25   -> 706.2675092
B39     = B28+B32   -> 1600.85984
B40     = B35   -> 0
B41     = B25+B28+B32+B35   -> 2307.127349
B42     = B41*B15   -> 2307.127349
D47     = B24   -> 7.062675092
E47     = ProfileCuttingRate   -> 1.25
F47     = IF(A47="Yes",D47*E47,0)   -> 8.828343865
D48     = VLOOKUP((B10)*(B9),MillingTable,3,TRUE())   -> 0.6
E48     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F48     = (shared//inherited)   -> 210
D49     = VLOOKUP(B13,DrillingTable,3,TRUE())*B14   -> 0.24
E49     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F49     = (shared//inherited)   -> 84
B51     = F47+F48+F49   -> 302.8283439
B54     = Tube_OD   -> 150
B55     = VLOOKUP(B54,WeldBeadTable,3,TRUE())   -> 5
B57     = (B54*3.14)/25.4   -> 18.54330709
B58     = WeldRatePerInchBead   -> 14
B59     = B57*B58*B55*B56   -> 1298.031496

## Trunnion  (30 formulas)
B7      = H28   -> 95
B8      = H26   -> 170
B9      = H26   -> 170
B13     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B14     = IF(B6="MS-EN8",VLOOKUP(H26,EN8RateTable,3,TRUE()),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 80
B15     = (B7)*(B8)*(B9)*B13/1000000   -> 21.552175
B16     = B15*B10   -> 43.10435
B17     = IF(B4="No",0,B15*B14)   -> 1724.174
B18     = B17*B10   -> 3448.348
H25     = IF(G22="",IFERROR(VLOOKUP(Tube_OD,TrunnionGeomTable,2,TRUE()),0),G22)   -> 85
H26     = IF(H22="",IFERROR(VLOOKUP(Tube_OD,TrunnionGeomTable,3,TRUE()),0),H22)   -> 170
H27     = IF(I22="",IFERROR(VLOOKUP(Tube_OD,TrunnionGeomTable,4,TRUE()),0),I22)   -> 42
H28     = IF(J22="",IFERROR(VLOOKUP(Tube_OD,TrunnionGeomTable,5,TRUE()),0),J22)   -> 95
D30     = VLOOKUP((B20)*(B21),MillingTable,3,TRUE())   -> 0.3
E30     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F30     = IF(A30="Yes",D30*E30,0)   -> 105
D31     = VLOOKUP(B22,DrillingTable,3,TRUE())*B23   -> 0.1
E31     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F31     = (shared//inherited)   -> 35
B34     = F27+F28+F29+F30+F31   -> 140
B42     = B17   -> 1724.174
B43     = B34+B55   -> 1438.031496
B44     = B37   -> 0
B45     = B42+B43+B44   -> 3162.205496
B46     = B45*B10   -> 6324.410992
B50     = Tube_OD   -> 150
B51     = VLOOKUP(B50,WeldBeadTable,3,TRUE())   -> 5
B53     = (B50*3.14)/25.4   -> 18.54330709
B54     = WeldRatePerInchBead   -> 14
B55     = B53*B54*B51*B52   -> 1298.031496

## Flange  (30 formulas)
B7      = FlangeOwn_OD   -> 225
B8      = FlangeOwn_Length   -> 45
B12     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B13     = IF(B6="MS-C45",IFERROR(VLOOKUP(FlangeOwn_Length,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B14     = (PI()/4)*((B7)^2)*B8*B12/1000000   -> 14.04549625
B15     = B14*B9   -> 14.04549625
B16     = IF(B4="No",0,B14*B13)   -> 1404.549625
B17     = B16*B9   -> 1404.549625
D26     = INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B8,TurningLenBins,1))   -> 0.8
E26     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F26     = IF(A26="Yes",D26*E26,0)   -> 440
D27     = VLOOKUP((B19)*(B20),MillingTable,3,TRUE())   -> 0.3
E27     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F27     = (shared//inherited)   -> 105
D28     = VLOOKUP(B21,DrillingTable,3,TRUE())*B22   -> 0.2
E28     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F28     = (shared//inherited)   -> 70
B31     = F26+F27+F28   -> 615
H31     = IF(G28="",IFERROR(VLOOKUP(Tube_OD,FlangeGeomTable,2,TRUE()),0),G28)   -> 225
H32     = IF(H28="",IFERROR(VLOOKUP(Tube_OD,FlangeGeomTable,3,TRUE()),0),H28)   -> 45
B39     = B16   -> 1404.549625
B40     = B31+B52   -> 1913.031496
B41     = B34   -> 0
B42     = B39+B40+B41   -> 3317.581121
B43     = B42*B9   -> 3317.581121
B47     = Tube_OD   -> 150
B48     = VLOOKUP(B47,WeldBeadTable,3,TRUE())   -> 5
B50     = (B47*3.14)/25.4   -> 18.54330709
B51     = WeldRatePerInchBead   -> 14
B52     = B50*B51*B48*B49   -> 1298.031496

## Gland  (30 formulas)
B7      = Gland_OD   -> 180
B8      = Gland_ID   -> 91
B9      = Gland_Length   -> 100
B13     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B14     = IF(B6="MS-C45",IFERROR(VLOOKUP(Gland_Length,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B15     = (PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000   -> 14.87026937
B16     = B15*B10   -> 14.87026937
B17     = IF(B4="No",0,B15*B14)   -> 1487.026937
B18     = B17*B10   -> 1487.026937
D27     = INDEX(RoughTurningTable,MATCH(B7,TurningODBins,1),MATCH(B9,TurningLenBins,1))   -> 0.8
E27     = INDEX(MachineRateMaster_Range,MATCH("CNC Lathe",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 550
F27     = IF(A27="Yes",D27*E27,0)   -> 440
D28     = VLOOKUP((B20)*(B21),MillingTable,3,TRUE())   -> 0.3
E28     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F28     = (shared//inherited)   -> 105
D29     = VLOOKUP(B22,DrillingTable,3,TRUE())*B23   -> 0.06
E29     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F29     = (shared//inherited)   -> 21
D30     = PI()*B8*B9/100   -> 285.8849315
E30     = GrindingRate   -> 0.4
F30     = (shared//inherited)   -> 114.3539726
H30     = IF(G27="",IFERROR(VLOOKUP(RodDia,GlandGeomTable,2,TRUE()),0),G27)   -> 91
H31     = IF(H27="",IFERROR(VLOOKUP(RodDia,GlandGeomTable,3,TRUE()),0),H27)   -> 180
H32     = IF(I27="",IFERROR(VLOOKUP(RodDia,GlandGeomTable,4,TRUE()),0),I27)   -> 100
B33     = F27+F28+F29+F30   -> 680.3539726
B41     = B17   -> 1487.026937
B42     = B33   -> 680.3539726
B43     = B36   -> 0
B44     = B17+B33+B36   -> 2167.380909
B45     = B44*B10   -> 2167.380909

## Foot Lug  (34 formulas)
B7      = Foot_Lug_Thickness   -> 22
B8      = Foot_Lug_Width   -> 82
B9      = Foot_Lug_Length   -> 53
B10     = Foot_Lug_HoleDia   -> 17
B15     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B16     = IF(B6="MS-C45",IFERROR(VLOOKUP(Foot_Lug_Thickness,C45RateTable,3,TRUE()),INDEX(C45RateTable,1,3)),INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4))   -> 100
B17     = B8*B9*B7   -> 95612
B18     = (PI()/4)*(B10)^2*B7   -> 4993.561523
B19     = B17-B18   -> 90618.43848
B20     = B19*B11   -> 362473.7539
B21     = B20*B15/1000000   -> 2.845418968
B22     = IF(B4="No",0,B21*B16)   -> 284.5418968
I24     = IF(H21="",IFERROR(VLOOKUP(Tube_OD,FootLugGeomTable,2,TRUE()),0),H21)   -> 22
I25     = IF(I21="",IFERROR(VLOOKUP(Tube_OD,FootLugGeomTable,3,TRUE()),0),I21)   -> 82
I26     = IF(J21="",IFERROR(VLOOKUP(Tube_OD,FootLugGeomTable,4,TRUE()),0),J21)   -> 53
D27     = VLOOKUP((B8)*(B9),MillingTable,3,TRUE())   -> 0.3
E27     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F27     = IF(A27="Yes",D27*E27,0)   -> 105
I27     = IF(K21="",IFERROR(VLOOKUP(Tube_OD,FootLugGeomTable,5,TRUE()),0),K21)   -> 17
D28     = VLOOKUP(B10,DrillingTable,3,TRUE())*B11   -> 0.2
E28     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F28     = (shared//inherited)   -> 70
B30     = F27+F28   -> 175
B33     = Tube_OD   -> 150
B34     = VLOOKUP(B33,WeldBeadTable,3,TRUE())   -> 5
B35     = B11   -> 4
B36     = (B33*3.14)/25.4   -> 18.54330709
B37     = WeldRatePerInchBead   -> 14
B38     = B36*B37*B34*B35   -> 5192.125984
B44     = B22   -> 284.5418968
B45     = B30+B38   -> 5367.125984
B46     = B41   -> 0
B47     = B44+B45+B41   -> 5651.667881
B48     = IF(Mounting_FootLug="Yes",B47*B12,0)   -> 0

## Tie Rod  (28 formulas)
B4      = Mounting_TieRod   -> "No"
B5      = IF(ISNUMBER(TieRodQuantityActive),TieRodQuantityActive,4)   -> 4
B8      = Bore   -> 125
B9      = WorkingPressure   -> 250
B13     = B11/B12   -> 98
B15     = (PI()/4)*(B8)^2*(B9/10)   -> 306796.1576
B16     = B15/B5   -> 76699.03939
B17     = B16/B13   -> 782.6432591
B18     = SQRT(4*B17/PI())   -> 31.56726702
B19     = CEILING(B18,5)   -> 35
B21     = IF(B20="",B19,B20)   -> 35
B24     = Stroke   -> 115
B26     = B24+B25   -> 265
B28     = IF(B27="",B26,B27)   -> 265
B31     = INDEX(MaterialMaster_Range,MATCH(B10,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B32     = INDEX(MaterialMaster_Range,MATCH(B10,INDEX(MaterialMaster_Range,0,1),0),4)   -> 160
B33     = (PI()/4)*(B21)^2*(B28)*B31/1000000   -> 2.001435049
B34     = B33*B5   -> 8.005740194
B35     = IF(B30="No",0,B34*B32)   -> 1280.918431
D39     = VLOOKUP(B21,CuttingTable,MATCH(B28,CuttingLenBins,1),TRUE())*B5   -> 1
E39     = INDEX(MachineRateMaster_Range,MATCH("Cutting Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F39     = IF(A39="Yes",D39*E39,0)   -> 350
B42     = B41*B5   -> 100
B44     = F39+B42   -> 450
B50     = B35   -> 1280.918431
B51     = B44   -> 450
B52     = B47   -> 0
B53     = IF(Mounting_TieRod="Yes",B50+B51+B47,0)   -> 0

## Front Flange  (30 formulas)
B7      = FrontFlange_Width   -> 235
B8      = FrontFlange_Thickness   -> 50
B9      = FrontFlange_HoleDia   -> 23
B14     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),3)   -> 7.85
B15     = INDEX(MaterialMaster_Range,MATCH(B6,INDEX(MaterialMaster_Range,0,1),0),4)   -> 85
B16     = B7*B7*B8   -> 2761250
B17     = (PI()/4)*(B9)^2*B8*B10   -> 83095.12569
B18     = B16-B17   -> 2678154.874
B19     = B18*B14/1000000   -> 21.02351576
B20     = IF(B4="No",0,B19*B15)   -> 1786.99884
I23     = IF(H20="",IFERROR(VLOOKUP(Bore,FrontFlangeGeomTable,2,TRUE()),0),H20)   -> 235
I24     = IF(I20="",IFERROR(VLOOKUP(Bore,FrontFlangeGeomTable,3,TRUE()),0),I20)   -> 50
D25     = VLOOKUP((B7)*(B7),MillingTable,3,TRUE())   -> 1.8
E25     = INDEX(MachineRateMaster_Range,MATCH("Milling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F25     = IF(A25="Yes",D25*E25,0)   -> 630
I25     = IF(J20="",IFERROR(VLOOKUP(Bore,FrontFlangeGeomTable,4,TRUE()),0),J20)   -> 23
D26     = VLOOKUP(B9,DrillingTable,3,TRUE())*B10   -> 0.32
E26     = INDEX(MachineRateMaster_Range,MATCH("Drilling Machine",INDEX(MachineRateMaster_Range,0,1),0),2)   -> 350
F26     = (shared//inherited)   -> 112
B28     = F25+F26   -> 742
B31     = Tube_OD   -> 150
B32     = VLOOKUP(B31,WeldBeadTable,3,TRUE())   -> 5
B34     = (B31*3.14)/25.4   -> 18.54330709
B35     = WeldRatePerInchBead   -> 14
B36     = B34*B35*B32*B33   -> 1298.031496
B42     = B20   -> 1786.99884
B43     = B28+B36   -> 2040.031496
B44     = B39   -> 0
B45     = B42+B43+B39   -> 3827.030336
B46     = IF(Mounting_FrontFlange="Yes",B45*B11,0)   -> 0

## Geometry Master  (9 formulas)
D7      = Bore   -> 125
D8      = TubeOD   -> 150
D9      = Bore+TubeBoringAllowance   -> 130
D13     = RodDia   -> 90
D45     = PistonRod_OD   -> 90
D55     = Tube_OD   -> 150
D58     = Mounting_Trunnion   -> "Yes"
D66     = Mounting_CECClevis   -> "No"
D67     = Bore   -> 125

## Bought Out & Seal Kit Master  (16 formulas)
A4      = "Seal Kit ("&SealBrand&" / "&SealMaterial&" / "&SealType&")"   -> "Seal Kit (Freudenberg / Viton / Normal Glide Ring)"
D4      = IF(ISNUMBER(SealSalePrice),SealSalePrice,0)   -> 12188
F4      = IF(C4="Yes",D4*E4,0)   -> 12188
G4      = IF(ISNUMBER(SealSalePrice),"Auto-priced from Seal Master (Universal brand catalogue, 25% sale markup applied). Verify against latest supplier list before final quotation.",SealSalePrice)   -> "Auto-priced from Seal Master (Universal brand catalogue, 25% sale markup applied). Verify against latest supplier list before final quotation."
F5      = (shared//inherited)   -> 360
F6      = (shared//inherited)   -> 0
F7      = (shared//inherited)   -> 0
F8      = (shared//inherited)   -> 0
F9      = (shared//inherited)   -> 0
F10     = (shared//inherited)   -> 0
F11     = (shared//inherited)   -> 0
F12     = (shared//inherited)   -> 0
F13     = (shared//inherited)   -> 0
F14     = (shared//inherited)   -> 0
B16     = SUMIFS(F4:F14,B4:B14,"Seal Kit",C4:C14,"Yes")   -> 12188
B17     = SUMIFS(F4:F14,B4:B14,"Bought Out",C4:C14,"Yes")   -> 360

## Assembly Painting Packing  (6 formulas)
B7      = B5*B6   -> 750
B11     = PaintingRate   -> 0.2
B12     = B10*B11   -> 900
B17     = IF(B15="Wooden Box",PackingWoodenRate,PackingLooseRate)   -> 15
B18     = B16*B17   -> 2250
B21     = B7+B12+B18   -> 3900

## Cost Summary  (29 formulas)
B2      = CylinderName   -> ""
B3      = InquiryNo   -> "INQ-0001"
A4      = TRIM(IF(Tube!H10="CHECK RAW OD","WARNING: Tube Raw OD is invalid (Raw OD must exceed Raw ID) - Tube cost is EXCLUDED from the total below until fixed on the Tube sheet.  ","")&IF(OR(Bore<40,Bore>250),"WARNING: ENTER THE SEAL SIZE MANUALLY - Bore is outside the priced seal range (40-250mm), seal cost is not included.",""))   -> ""
B7      = Tube_TotalCost   -> 12435.93958
B8      = PistonRod_TotalCost   -> 7990.363423
B9      = CEC_TotalCost   -> 1380.650866
B10     = HEC_TotalCost   -> 1380.650866
B11     = Gland_TotalCost   -> 2167.380909
B12     = IF(ComponentPresent_CushionBush="Yes",CushionBush_TotalCost,0)   -> 7237.71871
B13     = IF(ComponentPresent_StopTube="Yes",StopTube_TotalCost,0)   -> 0
B14     = IF(ComponentPresent_RearEye="Yes",RearEye_TotalCost,0)   -> 0
B15     = IF(Mounting_RodEye="Yes",RodEye_TotalCost,0)   -> 848.9897726
B16     = Piston_TotalCost   -> 697.9100252
B17     = Flange_TotalCost   -> 3317.581121
B18     = IF(Mounting_Trunnion="Yes",Trunnion_TotalCost,0)   -> 6324.410992
B19     = SUM(B7:B18)+IF(Mounting_CECClevis="Yes",CECClevis_TotalCost,0)+IF(Mounting_TieRod="Yes",TieRod_TotalCost,0)+IF(Mounting_FootLug="Yes",FootLug_TotalCost,0)+IF(Mounting_FrontFlange="Yes",FrontFlange_TotalCost,0)   -> 43781.59627
B20     = IF(Mounting_CECClevis="Yes",CECClevis_TotalCost,0)   -> 0
B22     = IFERROR(Tube_Weight,0)+IFERROR(PistonRod_Weight,0)+IFERROR(CEC_Weight,0)+IFERROR(HEC_Weight,0)+IFERROR(Gland_Weight,0)+IF(ComponentPresent_CushionBush="Yes",IFERROR(CushionBush_Weight,0),0)+IF(ComponentPresent_StopTube="Yes",IFERROR(StopTube_Weight,0),0)+IF(ComponentPresent_RearEye="Yes",IFERROR(RearEye_Weight,0),0)+IFERROR(RodEye_Weight,0)+IFERROR(Piston_Weight,0)+IFERROR(Flange_Weight,0)+IFERROR(Trunnion_Weight,0)+IF(Mounting_CECClevis="Yes",IFERROR(CECClevis_Weight,0),0)+IF(Mounting_FootLug="Yes",IFERROR(FootLug_Weight,0),0)+IF(Mounting_TieRod="Yes",IFERROR(TieRod_Weight,0),0)+IF(Mounting_FrontFlange="Yes",IFERROR(FrontFlange_Weight,0),0)   -> 178.7657712
B24     = B22+B23   -> 178.7657712
B25     = IF(Mounting_TieRod="Yes",TieRod_TotalCost,0)   -> 0
B27     = TotalSealKitCost   -> 12188
B28     = TotalBoughtOutCost+BOC_CalculatedItems_GrandTotal   -> 3514.508522
B29     = AssemblyCost   -> 750
B30     = PaintingCost   -> 900
B31     = PackingCost   -> 2250
B32     = SUM(B27:B31)   -> 19602.50852
B33     = IF(Mounting_FootLug="Yes",FootLug_TotalCost,0)   -> 0
B36     = IF(Mounting_FrontFlange="Yes",FrontFlange_TotalCost,0)   -> 0
B38     = B19+B32+B35   -> 63384.10479

## Actual Cost Tracker  (58 formulas)
B5      = Tube_MaterialCost   -> 6323.455813
D5      = Tube_ProcessCost   -> 6112.48377
F5      = (C5+E5)-(B5+D5)   -> -12435.93958
G5      = IF((B5+D5)=0,0,F5/(B5+D5))   -> -1
B6      = PistonRod_MaterialCost   -> 3394.193393
D6      = PistonRod_ProcessCost   -> 4596.17003
F6      = (shared//inherited)   -> -7990.363423
G6      = (shared//inherited)   -> -1
B7      = CEC_MaterialCost   -> 765.650866
D7      = CEC_ProcessCost   -> 615
F7      = (shared//inherited)   -> -1380.650866
G7      = (shared//inherited)   -> -1
B8      = HEC_MaterialCost   -> 765.650866
D8      = HEC_ProcessCost   -> 615
F8      = (shared//inherited)   -> -1380.650866
G8      = (shared//inherited)   -> -1
B9      = Gland_MaterialCost   -> 1487.026937
D9      = Gland_ProcessCost   -> 680.3539726
F9      = (shared//inherited)   -> -2167.380909
G9      = (shared//inherited)   -> -1
B10     = CushionBush_MaterialCost   -> 6880.383849
D10     = CushionBush_ProcessCost   -> 357.3348603
F10     = (shared//inherited)   -> -7237.71871
G10     = (shared//inherited)   -> -1
B11     = StopTube_MaterialCost   -> 1032.361314
D11     = StopTube_ProcessCost   -> 371.25
F11     = (shared//inherited)   -> -1403.611314
G11     = (shared//inherited)   -> -1
B12     = RearEye_MaterialCost   -> 103.5905625
D12     = RearEye_ProcessCost   -> 148.5233906
F12     = (shared//inherited)   -> -252.1139531
G12     = (shared//inherited)   -> -1
B13     = RodEye_MaterialCost   -> 588.3377469
D13     = RodEye_ProcessCost   -> 260.6520257
F13     = (shared//inherited)   -> -848.9897726
G13     = (shared//inherited)   -> -1
B14     = Piston_MaterialCost   -> 541.8787133
D14     = Piston_ProcessCost   -> 156.0313119
F14     = (shared//inherited)   -> -697.9100252
G14     = (shared//inherited)   -> -1
B15     = Flange_MaterialCost   -> 1404.549625
D15     = Flange_ProcessCost   -> 1913.031496
F15     = (shared//inherited)   -> -3317.581121
G15     = (shared//inherited)   -> -1
B16     = Trunnion_MaterialCost   -> 1724.174
D16     = Trunnion_ProcessCost   -> 1438.031496
F16     = (shared//inherited)   -> -3162.205496
G16     = (shared//inherited)   -> -1
B17     = SUM(B5:B16)   -> 25011.25369
C17     = (shared//inherited)   -> 0
D17     = (shared//inherited)   -> 17263.86235
E17     = (shared//inherited)   -> 0
F17     = (shared//inherited)   -> -42275.11604
G17     = IF(SUM(B5:B16,D5:D16)=0,0,F17/SUM(B5:B16,D5:D16))   -> -1
B23     = C17+E17+B20+B21+B22   -> 0
B24     = TotalManufacturingCost   -> 63384.10479
B25     = B23-B24   -> -63384.10479
B26     = IF(B24=0,0,(B23-B24)/B24)   -> -1

## MASTER REVIEW - FREEZE CHECK  (980 formulas)
A6      = 'Material Master'!A4   -> "MS-EN8"
B6      = 'Material Master'!B4   -> "EN8 Carbon Steel"
C6      = 'Material Master'!C4   -> 7.85
D6      = 'Material Master'!D4   -> 100
A7      = 'Material Master'!A5   -> "MS-EN19"
B7      = 'Material Master'!B5   -> "EN19 Alloy Steel"
C7      = 'Material Master'!C5   -> 7.85
D7      = 'Material Master'!D5   -> 100
A8      = 'Material Master'!A6   -> "MS-EN24"
B8      = 'Material Master'!B6   -> "EN24 Alloy Steel"
C8      = 'Material Master'!C6   -> 7.85
D8      = 'Material Master'!D6   -> 140
A9      = 'Material Master'!A7   -> "MS-C45"
B9      = 'Material Master'!B7   -> "C45 Carbon Steel"
C9      = 'Material Master'!C7   -> 7.85
D9      = 'Material Master'!D7   -> 100
A10     = 'Material Master'!A8   -> "MS-ST52"
B10     = 'Material Master'!B8   -> "ST52 Seamless Tube"
C10     = 'Material Master'!C8   -> 7.85
D10     = 'Material Master'!D8   -> 160
A11     = 'Material Master'!A9   -> "SS-410"
B11     = 'Material Master'!B9   -> "SS 410 Stainless"
C11     = 'Material Master'!C9   -> 7.7
D11     = 'Material Master'!D9   -> 410
A12     = 'Material Master'!A10   -> "BR-SAE660"
B12     = 'Material Master'!B10   -> "Bronze SAE 660"
C12     = 'Material Master'!C10   -> 8.9
D12     = 'Material Master'!D10   -> 1800
A13     = 'Material Master'!A11   -> "MS-EN353"
B13     = 'Material Master'!B11   -> "EN353 Case Hardening Steel"
C13     = 'Material Master'!C11   -> 7.85
D13     = 'Material Master'!D11   -> 140
A14     = 'Material Master'!A12   -> "MS-PLATE-IS2062"
B14     = 'Material Master'!B12   -> "IS2062 Plate"
C14     = 'Material Master'!C12   -> 7.85
D14     = 'Material Master'!D12   -> 85
A18     = 'Machine Rate Master'!A4   -> "CNC Lathe"
B18     = 'Machine Rate Master'!B4   -> 550
A19     = 'Machine Rate Master'!A5   -> "Conventional Lathe"
B19     = 'Machine Rate Master'!B5   -> 500
A20     = 'Machine Rate Master'!A6   -> "Milling Machine"
B20     = 'Machine Rate Master'!B6   -> 350
A21     = 'Machine Rate Master'!A7   -> "Drilling Machine"
B21     = 'Machine Rate Master'!B7   -> 350
A22     = 'Machine Rate Master'!A8   -> "Honing Machine"
B22     = 'Machine Rate Master'!B8   -> 550
A23     = 'Machine Rate Master'!A9   -> "Grinding Machine"
B23     = 'Machine Rate Master'!B9   -> 650
A24     = 'Machine Rate Master'!A10   -> "Cutting Machine"
B24     = 'Machine Rate Master'!B10   -> 350
A29     = 'Process Rate Master'!A4   -> "Heat Treatment"
B29     = 'Process Rate Master'!B4   -> 12
C29     = 'Process Rate Master'!C4   -> "Rs./kg"
A30     = 'Process Rate Master'!A5   -> "Induction Hardening"
B30     = 'Process Rate Master'!B5   -> 0.45
C30     = 'Process Rate Master'!C5   -> "Rs./cm2"
A31     = 'Process Rate Master'!A6   -> "Grinding"
B31     = 'Process Rate Master'!B6   -> 0.4
C31     = 'Process Rate Master'!C6   -> "Rs./cm2"
A32     = 'Process Rate Master'!A7   -> "Polishing"
B32     = 'Process Rate Master'!B7   -> 0.2
C32     = 'Process Rate Master'!C7   -> "Rs./cm2"
A33     = 'Process Rate Master'!A8   -> "Painting"
B33     = 'Process Rate Master'!B8   -> 0.2
C33     = 'Process Rate Master'!C8   -> "Rs./cm2"
A34     = 'Process Rate Master'!A9   -> "Chrome Plating"
B34     = 'Process Rate Master'!B9   -> 0.6
C34     = 'Process Rate Master'!C9   -> "Rs./cm2"
A35     = 'Process Rate Master'!A10   -> "Dechrome Plating"
B35     = 'Process Rate Master'!B10   -> 0.35
C35     = 'Process Rate Master'!C10   -> "Rs./cm2"
A36     = 'Process Rate Master'!A11   -> "Profile Cutting"
B36     = 'Process Rate Master'!B11   -> 1.25
C36     = 'Process Rate Master'!C11   -> "Rs./kg"
A37     = 'Process Rate Master'!A12   -> "Packing - Loose"
B37     = 'Process Rate Master'!B12   -> 5
C37     = 'Process Rate Master'!C12   -> "Rs./kg"
A38     = 'Process Rate Master'!A13   -> "Packing - Wooden Box"
B38     = 'Process Rate Master'!B13   -> 15
C38     = 'Process Rate Master'!C13   -> "Rs./kg"
A42     = 'Process Rate Master'!B19   -> "Up to 100 mm"
B42     = 'Process Rate Master'!C19   -> 300
C42     = 'Process Rate Master'!D19   -> 400
A43     = 'Process Rate Master'!B20   -> "101-250 mm"
B43     = 'Process Rate Master'!C20   -> 550
C43     = 'Process Rate Master'!D20   -> 550
A44     = 'Process Rate Master'!B21   -> "Above 250 mm"
B44     = 'Process Rate Master'!C21   -> 700
C44     = 'Process Rate Master'!D21   -> 700
B47     = 'Process Rate Master'!B25   -> 0.3
B48     = 'Process Rate Master'!B26   -> 0.4
B49     = 'Process Rate Master'!B27   -> 4000
B50     = 'Process Rate Master'!B28   -> 100
B53     = 'Process Rate Master'!B41   -> 14
A56     = 'Process Rate Master'!B46   -> "50-75 mm"
B56     = 'Process Rate Master'!C46   -> 3
A57     = 'Process Rate Master'!B47   -> "76-100 mm"
B57     = 'Process Rate Master'!C47   -> 4
A58     = 'Process Rate Master'!B48   -> "101-125 mm"
B58     = 'Process Rate Master'!C48   -> 4
A59     = 'Process Rate Master'!B49   -> "126-150 mm"
B59     = 'Process Rate Master'!C49   -> 5
A60     = 'Process Rate Master'!B50   -> "151-175 mm"
B60     = 'Process Rate Master'!C50   -> 6
A61     = 'Process Rate Master'!B51   -> "176-200 mm"
B61     = 'Process Rate Master'!C51   -> 6
A69     = Trunnion!G8   -> 70
B69     = Trunnion!H8   -> 40
C69     = Trunnion!I8   -> 80
D69     = Trunnion!J8   -> 20
E69     = Trunnion!K8   -> 45
A70     = Trunnion!G9   -> 80
B70     = Trunnion!H9   -> 45
C70     = Trunnion!I9   -> 90
D70     = Trunnion!J9   -> 22
E70     = Trunnion!K9   -> 50
A71     = Trunnion!G10   -> 90
B71     = Trunnion!H10   -> 50
C71     = Trunnion!I10   -> 100
D71     = Trunnion!J10   -> 25
E71     = Trunnion!K10   -> 56
A72     = Trunnion!G11   -> 100
B72     = Trunnion!H11   -> 56
C72     = Trunnion!I11   -> 112
D72     = Trunnion!J11   -> 28
E72     = Trunnion!K11   -> 63
A73     = Trunnion!G12   -> 110
B73     = Trunnion!H12   -> 63
C73     = Trunnion!I12   -> 125
D73     = Trunnion!J12   -> 32
E73     = Trunnion!K12   -> 70
A74     = Trunnion!G13   -> 120
B74     = Trunnion!H13   -> 70
C74     = Trunnion!I13   -> 140
D74     = Trunnion!J13   -> 35
E74     = Trunnion!K13   -> 80
A75     = Trunnion!G14   -> 140
B75     = Trunnion!H14   -> 80
C75     = Trunnion!I14   -> 160
D75     = Trunnion!J14   -> 40
E75     = Trunnion!K14   -> 90
A76     = Trunnion!G15   -> 150
B76     = Trunnion!H15   -> 85
C76     = Trunnion!I15   -> 170
D76     = Trunnion!J15   -> 42
E76     = Trunnion!K15   -> 95
A77     = Trunnion!G16   -> 160
B77     = Trunnion!H16   -> 90
C77     = Trunnion!I16   -> 180
D77     = Trunnion!J16   -> 45
E77     = Trunnion!K16   -> 100
A78     = Trunnion!G17   -> 180
B78     = Trunnion!H17   -> 100
C78     = Trunnion!I17   -> 200
D78     = Trunnion!J17   -> 50
E78     = Trunnion!K17   -> 112
A79     = Trunnion!G18   -> 200
B79     = Trunnion!H18   -> 115
C79     = Trunnion!I18   -> 230
D79     = Trunnion!J18   -> 58
E79     = Trunnion!K18   -> 130
A84     = 'CEC Clevis'!E7   -> 50
B84     = 'CEC Clevis'!F7   -> 40
C84     = 'CEC Clevis'!G7   -> 20
D84     = 'CEC Clevis'!H7   -> 20.5
E84     = 'CEC Clevis'!I7   -> 20
F84     = 'CEC Clevis'!J7   -> 45
A85     = 'CEC Clevis'!E8   -> 63
B85     = 'CEC Clevis'!F8   -> 50
C85     = 'CEC Clevis'!G8   -> 25
D85     = 'CEC Clevis'!H8   -> 25.5
E85     = 'CEC Clevis'!I8   -> 25
F85     = 'CEC Clevis'!J8   -> 56
A86     = 'CEC Clevis'!E9   -> 80
B86     = 'CEC Clevis'!F9   -> 63
C86     = 'CEC Clevis'!G9   -> 32
D86     = 'CEC Clevis'!H9   -> 32.5
E86     = 'CEC Clevis'!I9   -> 32
F86     = 'CEC Clevis'!J9   -> 70
A87     = 'CEC Clevis'!E10   -> 100
B87     = 'CEC Clevis'!F10   -> 80
C87     = 'CEC Clevis'!G10   -> 40
D87     = 'CEC Clevis'!H10   -> 40.5
E87     = 'CEC Clevis'!I10   -> 40
F87     = 'CEC Clevis'!J10   -> 90
A88     = 'CEC Clevis'!E11   -> 125
B88     = 'CEC Clevis'!F11   -> 100
C88     = 'CEC Clevis'!G11   -> 50
D88     = 'CEC Clevis'!H11   -> 50.5
E88     = 'CEC Clevis'!I11   -> 50
F88     = 'CEC Clevis'!J11   -> 110
A89     = 'CEC Clevis'!E12   -> 150
B89     = 'CEC Clevis'!F12   -> 112
C89     = 'CEC Clevis'!G12   -> 56
D89     = 'CEC Clevis'!H12   -> 56.5
E89     = 'CEC Clevis'!I12   -> 56
F89     = 'CEC Clevis'!J12   -> 125
A90     = 'CEC Clevis'!E13   -> 160
B90     = 'CEC Clevis'!F13   -> 125
C90     = 'CEC Clevis'!G13   -> 63
D90     = 'CEC Clevis'!H13   -> 63.5
E90     = 'CEC Clevis'!I13   -> 63
F90     = 'CEC Clevis'!J13   -> 140
A91     = 'CEC Clevis'!E14   -> 180
B91     = 'CEC Clevis'!F14   -> 140
C91     = 'CEC Clevis'!G14   -> 70
D91     = 'CEC Clevis'!H14   -> 70.5
E91     = 'CEC Clevis'!I14   -> 70
F91     = 'CEC Clevis'!J14   -> 160
A92     = 'CEC Clevis'!E15   -> 200
B92     = 'CEC Clevis'!F15   -> 160
C92     = 'CEC Clevis'!G15   -> 80
D92     = 'CEC Clevis'!H15   -> 80.5
E92     = 'CEC Clevis'!I15   -> 80
F92     = 'CEC Clevis'!J15   -> 180
A97     = 'Rod Eye'!E7   -> 40
B97     = 'Rod Eye'!F7   -> 16
C97     = 'Rod Eye'!G7   -> 71
D97     = 'Rod Eye'!H7   -> 20
E97     = 'Rod Eye'!I7   -> 16.5
A98     = 'Rod Eye'!E8   -> 45
B98     = 'Rod Eye'!F8   -> 18
C98     = 'Rod Eye'!G8   -> 80
D98     = 'Rod Eye'!H8   -> 22
E98     = 'Rod Eye'!I8   -> 18.5
A99     = 'Rod Eye'!E9   -> 50
B99     = 'Rod Eye'!F9   -> 20
C99     = 'Rod Eye'!G9   -> 90
D99     = 'Rod Eye'!H9   -> 25
E99     = 'Rod Eye'!I9   -> 20.5
A100    = 'Rod Eye'!E10   -> 56
B100    = 'Rod Eye'!F10   -> 22
C100    = 'Rod Eye'!G10   -> 100
D100    = 'Rod Eye'!H10   -> 28
E100    = 'Rod Eye'!I10   -> 22.5
A101    = 'Rod Eye'!E11   -> 63
B101    = 'Rod Eye'!F11   -> 25
C101    = 'Rod Eye'!G11   -> 112
D101    = 'Rod Eye'!H11   -> 32
E101    = 'Rod Eye'!I11   -> 25.5
A102    = 'Rod Eye'!E12   -> 70
B102    = 'Rod Eye'!F12   -> 28
C102    = 'Rod Eye'!G12   -> 125
D102    = 'Rod Eye'!H12   -> 35
E102    = 'Rod Eye'!I12   -> 28.5
A103    = 'Rod Eye'!E13   -> 80
B103    = 'Rod Eye'!F13   -> 32
C103    = 'Rod Eye'!G13   -> 144
D103    = 'Rod Eye'!H13   -> 40
E103    = 'Rod Eye'!I13   -> 32.5
A104    = 'Rod Eye'!E14   -> 90
B104    = 'Rod Eye'!F14   -> 36
C104    = 'Rod Eye'!G14   -> 162
D104    = 'Rod Eye'!H14   -> 45
E104    = 'Rod Eye'!I14   -> 36.5
A105    = 'Rod Eye'!E15   -> 100
B105    = 'Rod Eye'!F15   -> 40
C105    = 'Rod Eye'!G15   -> 180
D105    = 'Rod Eye'!H15   -> 50
E105    = 'Rod Eye'!I15   -> 40.5
A110    = 'Foot Lug'!H7   -> 70
B110    = 'Foot Lug'!I7   -> 10
C110    = 'Foot Lug'!J7   -> 40
D110    = 'Foot Lug'!K7   -> 25
E110    = 'Foot Lug'!L7   -> 9
A111    = 'Foot Lug'!H8   -> 80
B111    = 'Foot Lug'!I8   -> 12
C111    = 'Foot Lug'!J8   -> 45
D111    = 'Foot Lug'!K8   -> 28
E111    = 'Foot Lug'!L8   -> 9
A112    = 'Foot Lug'!H9   -> 90
B112    = 'Foot Lug'!I9   -> 12
C112    = 'Foot Lug'!J9   -> 50
D112    = 'Foot Lug'!K9   -> 32
E112    = 'Foot Lug'!L9   -> 11
A113    = 'Foot Lug'!H10   -> 100
B113    = 'Foot Lug'!I10   -> 16
C113    = 'Foot Lug'!J10   -> 56
D113    = 'Foot Lug'!K10   -> 35
E113    = 'Foot Lug'!L10   -> 11
A114    = 'Foot Lug'!H11   -> 110
B114    = 'Foot Lug'!I11   -> 16
C114    = 'Foot Lug'!J11   -> 60
D114    = 'Foot Lug'!K11   -> 40
E114    = 'Foot Lug'!L11   -> 13
A115    = 'Foot Lug'!H12   -> 120
B115    = 'Foot Lug'!I12   -> 18
C115    = 'Foot Lug'!J12   -> 66
D115    = 'Foot Lug'!K12   -> 42
E115    = 'Foot Lug'!L12   -> 13
A116    = 'Foot Lug'!H13   -> 140
B116    = 'Foot Lug'!I13   -> 20
C116    = 'Foot Lug'!J13   -> 77
D116    = 'Foot Lug'!K13   -> 49
E116    = 'Foot Lug'!L13   -> 17
A117    = 'Foot Lug'!H14   -> 150
B117    = 'Foot Lug'!I14   -> 22
C117    = 'Foot Lug'!J14   -> 82
D117    = 'Foot Lug'!K14   -> 53
E117    = 'Foot Lug'!L14   -> 17
A118    = 'Foot Lug'!H15   -> 160
B118    = 'Foot Lug'!I15   -> 25
C118    = 'Foot Lug'!J15   -> 88
D118    = 'Foot Lug'!K15   -> 56
E118    = 'Foot Lug'!L15   -> 17
A119    = 'Foot Lug'!H16   -> 180
B119    = 'Foot Lug'!I16   -> 28
C119    = 'Foot Lug'!J16   -> 99
D119    = 'Foot Lug'!K16   -> 63
E119    = 'Foot Lug'!L16   -> 21
A120    = 'Foot Lug'!H17   -> 200
B120    = 'Foot Lug'!I17   -> 30
C120    = 'Foot Lug'!J17   -> 110
D120    = 'Foot Lug'!K17   -> 70
E120    = 'Foot Lug'!L17   -> 21
A125    = 'Front Flange'!H7   -> 25
B125    = 'Front Flange'!I7   -> 50
C125    = 'Front Flange'!J7   -> 10
D125    = 'Front Flange'!K7   -> 11
A126    = 'Front Flange'!H8   -> 32
B126    = 'Front Flange'!I8   -> 60
C126    = 'Front Flange'!J8   -> 13
D126    = 'Front Flange'!K8   -> 13
A127    = 'Front Flange'!H9   -> 40
B127    = 'Front Flange'!I9   -> 75
C127    = 'Front Flange'!J9   -> 16
D127    = 'Front Flange'!K9   -> 13
A128    = 'Front Flange'!H10   -> 50
B128    = 'Front Flange'!I10   -> 95
C128    = 'Front Flange'!J10   -> 20
D128    = 'Front Flange'!K10   -> 15
A129    = 'Front Flange'!H11   -> 63
B129    = 'Front Flange'!I11   -> 120
C129    = 'Front Flange'!J11   -> 25
D129    = 'Front Flange'!K11   -> 15
A130    = 'Front Flange'!H12   -> 80
B130    = 'Front Flange'!I12   -> 150
C130    = 'Front Flange'!J12   -> 32
D130    = 'Front Flange'!K12   -> 19
A131    = 'Front Flange'!H13   -> 100
B131    = 'Front Flange'!I13   -> 190
C131    = 'Front Flange'!J13   -> 40
D131    = 'Front Flange'!K13   -> 19
A132    = 'Front Flange'!H14   -> 125
B132    = 'Front Flange'!I14   -> 235
C132    = 'Front Flange'!J14   -> 50
D132    = 'Front Flange'!K14   -> 23
A133    = 'Front Flange'!H15   -> 160
B133    = 'Front Flange'!I15   -> 300
C133    = 'Front Flange'!J15   -> 62
D133    = 'Front Flange'!K15   -> 27
A134    = 'Front Flange'!H16   -> 200
B134    = 'Front Flange'!I16   -> 375
C134    = 'Front Flange'!J16   -> 78
D134    = 'Front Flange'!K16   -> 27
A140    = 'Seal Master'!A9   -> 40
B140    = 'Seal Master'!B9   -> 30
C140    = 'Seal Master'!C9   -> 866.8
D140    = 'Seal Master'!D9   -> 1733.6
E140    = 'Seal Master'!E9   -> 2383.7
A141    = 'Seal Master'!A10   -> 50
B141    = 'Seal Master'!B10   -> 30
C141    = 'Seal Master'!C10   -> 981
D141    = 'Seal Master'!D10   -> 1962
E141    = 'Seal Master'!E10   -> 2697.75
A142    = 'Seal Master'!A11   -> 60
B142    = 'Seal Master'!B11   -> 30
C142    = 'Seal Master'!C11   -> 1101.2
D142    = 'Seal Master'!D11   -> 2202.4
E142    = 'Seal Master'!E11   -> 3028.3
A143    = 'Seal Master'!A12   -> 70
B143    = 'Seal Master'!B12   -> 40
C143    = 'Seal Master'!C12   -> 1379.4
D143    = 'Seal Master'!D12   -> 2758.8
E143    = 'Seal Master'!E12   -> 3793.35
A144    = 'Seal Master'!A13   -> 80
B144    = 'Seal Master'!B13   -> 40
C144    = 'Seal Master'!C13   -> 1490.6
D144    = 'Seal Master'!D13   -> 2981.2
E144    = 'Seal Master'!E13   -> 4099.15
A145    = 'Seal Master'!A14   -> 90
B145    = 'Seal Master'!B14   -> 50
C145    = 'Seal Master'!C14   -> 1857.8
D145    = 'Seal Master'!D14   -> 3715.6
E145    = 'Seal Master'!E14   -> 5108.95
A146    = 'Seal Master'!A15   -> 100
B146    = 'Seal Master'!B15   -> 60
C146    = 'Seal Master'!C15   -> 2086
D146    = 'Seal Master'!D15   -> 4172
E146    = 'Seal Master'!E15   -> 5736.5
A147    = 'Seal Master'!A16   -> 110
B147    = 'Seal Master'!B16   -> 70
C147    = 'Seal Master'!C16   -> 2616.2
D147    = 'Seal Master'!D16   -> 5232.4
E147    = 'Seal Master'!E16   -> 7194.55
A148    = 'Seal Master'!A17   -> 120
B148    = 'Seal Master'!B17   -> 80
C148    = 'Seal Master'!C17   -> 3545.6
D148    = 'Seal Master'!D17   -> 7091.2
E148    = 'Seal Master'!E17   -> 9750.4
A149    = 'Seal Master'!A18   -> 130
B149    = 'Seal Master'!B18   -> 80
C149    = 'Seal Master'!C18   -> 4246.9
D149    = 'Seal Master'!D18   -> 8493.8
E149    = 'Seal Master'!E18   -> 11678.975
A150    = 'Seal Master'!A19   -> 140
B150    = 'Seal Master'!B19   -> 90
C150    = 'Seal Master'!C19   -> 4808.2
D150    = 'Seal Master'!D19   -> 9616.4
E150    = 'Seal Master'!E19   -> 13222.55
A151    = 'Seal Master'!A20   -> 150
B151    = 'Seal Master'!B20   -> 100
C151    = 'Seal Master'!C20   -> 5249.5
D151    = 'Seal Master'!D20   -> 10499
E151    = 'Seal Master'!E20   -> 14436.125
A152    = 'Seal Master'!A21   -> 160
B152    = 'Seal Master'!B21   -> 120
C152    = 'Seal Master'!C21   -> 5635.8
D152    = 'Seal Master'!D21   -> 11271.6
E152    = 'Seal Master'!E21   -> 15498.45
A153    = 'Seal Master'!A22   -> 170
B153    = 'Seal Master'!B22   -> 120
C153    = 'Seal Master'!C22   -> 5867.1
D153    = 'Seal Master'!D22   -> 11734.2
E153    = 'Seal Master'!E22   -> 16134.525
A154    = 'Seal Master'!A23   -> 180
B154    = 'Seal Master'!B23   -> 130
C154    = 'Seal Master'!C23   -> 6278.4
D154    = 'Seal Master'!D23   -> 12556.8
E154    = 'Seal Master'!E23   -> 17265.6
A155    = 'Seal Master'!A24   -> 190
B155    = 'Seal Master'!B24   -> 140
C155    = 'Seal Master'!C24   -> 7089.7
D155    = 'Seal Master'!D24   -> 14179.4
E155    = 'Seal Master'!E24   -> 19496.675
A156    = 'Seal Master'!A25   -> 200
B156    = 'Seal Master'!B25   -> 150
C156    = 'Seal Master'!C25   -> 8036
D156    = 'Seal Master'!D25   -> 16072
E156    = 'Seal Master'!E25   -> 22099
A157    = 'Seal Master'!A26   -> 210
B157    = 'Seal Master'!B26   -> 160
C157    = 'Seal Master'!C26   -> 9530.5
D157    = 'Seal Master'!D26   -> 19061
E157    = 'Seal Master'!E26   -> 26208.875
A158    = 'Seal Master'!A27   -> 220
B158    = 'Seal Master'!B27   -> 170
C158    = 'Seal Master'!C27   -> 9796
D158    = 'Seal Master'!D27   -> 19592
E158    = 'Seal Master'!E27   -> 26939
A159    = 'Seal Master'!A28   -> 230
B159    = 'Seal Master'!B28   -> 180
C159    = 'Seal Master'!C28   -> 11261.5
D159    = 'Seal Master'!D28   -> 22523
E159    = 'Seal Master'!E28   -> 30969.125
A160    = 'Seal Master'!A29   -> 240
B160    = 'Seal Master'!B29   -> 190
C160    = 'Seal Master'!C29   -> 11852
D160    = 'Seal Master'!D29   -> 23704
E160    = 'Seal Master'!E29   -> 32593
A161    = 'Seal Master'!A30   -> 250
B161    = 'Seal Master'!B30   -> 200
C161    = 'Seal Master'!C30   -> 13442.5
D161    = 'Seal Master'!D30   -> 26885
E161    = 'Seal Master'!E30   -> 36966.875
A167    = 'BOC Calculated Items'!B8   -> 15
B167    = 'BOC Calculated Items'!C8   -> 0.5
C167    = 'BOC Calculated Items'!D8   -> 21.3
D167    = 'BOC Calculated Items'!E8   -> 2.77
A168    = 'BOC Calculated Items'!B9   -> 20
B168    = 'BOC Calculated Items'!C9   -> 0.75
C168    = 'BOC Calculated Items'!D9   -> 26.7
D168    = 'BOC Calculated Items'!E9   -> 2.87
A169    = 'BOC Calculated Items'!B10   -> 25
B169    = 'BOC Calculated Items'!C10   -> 1
C169    = 'BOC Calculated Items'!D10   -> 33.4
D169    = 'BOC Calculated Items'!E10   -> 3.38
A170    = 'BOC Calculated Items'!B11   -> 32
B170    = 'BOC Calculated Items'!C11   -> 1.25
C170    = 'BOC Calculated Items'!D11   -> 42.2
D170    = 'BOC Calculated Items'!E11   -> 3.56
A171    = 'BOC Calculated Items'!B12   -> 40
B171    = 'BOC Calculated Items'!C12   -> 1.5
C171    = 'BOC Calculated Items'!D12   -> 48.3
D171    = 'BOC Calculated Items'!E12   -> 3.68
A172    = 'BOC Calculated Items'!B13   -> 50
B172    = 'BOC Calculated Items'!C13   -> 2
C172    = 'BOC Calculated Items'!D13   -> 60.3
D172    = 'BOC Calculated Items'!E13   -> 3.91
A173    = 'BOC Calculated Items'!B14   -> 80
B173    = 'BOC Calculated Items'!C14   -> 3
C173    = 'BOC Calculated Items'!D14   -> 88.9
D173    = 'BOC Calculated Items'!E14   -> 5.49
A174    = 'BOC Calculated Items'!B15   -> 100
B174    = 'BOC Calculated Items'!C15   -> 4
C174    = 'BOC Calculated Items'!D15   -> 114.3
D174    = 'BOC Calculated Items'!E15   -> 6.02
A175    = 'BOC Calculated Items'!B16   -> 125
B175    = 'BOC Calculated Items'!C16   -> 5
C175    = 'BOC Calculated Items'!D16   -> 141.3
D175    = 'BOC Calculated Items'!E16   -> 6.55
A176    = 'BOC Calculated Items'!B17   -> 150
B176    = 'BOC Calculated Items'!C17   -> 6
C176    = 'BOC Calculated Items'!D17   -> 168.3
D176    = 'BOC Calculated Items'!E17   -> 7.11
A177    = 'BOC Calculated Items'!B18   -> 200
B177    = 'BOC Calculated Items'!C18   -> 8
C177    = 'BOC Calculated Items'!D18   -> 219.1
D177    = 'BOC Calculated Items'!E18   -> 8.18
A178    = 'BOC Calculated Items'!B19   -> 250
B178    = 'BOC Calculated Items'!C19   -> 10
C178    = 'BOC Calculated Items'!D19   -> 273
D178    = 'BOC Calculated Items'!E19   -> 9.27
A179    = 'BOC Calculated Items'!B20   -> 300
B179    = 'BOC Calculated Items'!C20   -> 12
C179    = 'BOC Calculated Items'!D20   -> 323.9
D179    = 'BOC Calculated Items'!E20   -> 9.53
A180    = 'BOC Calculated Items'!B21   -> 350
B180    = 'BOC Calculated Items'!C21   -> 14
C180    = 'BOC Calculated Items'!D21   -> 355.6
D180    = 'BOC Calculated Items'!E21   -> 11.13
A185    = 'BOC Calculated Items'!B36   -> 15
B185    = 'BOC Calculated Items'!C36   -> 89
C185    = 'BOC Calculated Items'!D36   -> 14
D185    = 'BOC Calculated Items'!E36   -> 4
E185    = 'BOC Calculated Items'!F36   -> 16
A186    = 'BOC Calculated Items'!B37   -> 20
B186    = 'BOC Calculated Items'!C37   -> 98
C186    = 'BOC Calculated Items'!D37   -> 16
D186    = 'BOC Calculated Items'!E37   -> 4
E186    = 'BOC Calculated Items'!F37   -> 16
A187    = 'BOC Calculated Items'!B38   -> 25
B187    = 'BOC Calculated Items'!C38   -> 108
C187    = 'BOC Calculated Items'!D38   -> 16
D187    = 'BOC Calculated Items'!E38   -> 4
E187    = 'BOC Calculated Items'!F38   -> 16
A188    = 'BOC Calculated Items'!B39   -> 32
B188    = 'BOC Calculated Items'!C39   -> 117
C188    = 'BOC Calculated Items'!D39   -> 16
D188    = 'BOC Calculated Items'!E39   -> 4
E188    = 'BOC Calculated Items'!F39   -> 16
A189    = 'BOC Calculated Items'!B40   -> 40
B189    = 'BOC Calculated Items'!C40   -> 127
C189    = 'BOC Calculated Items'!D40   -> 16
D189    = 'BOC Calculated Items'!E40   -> 4
E189    = 'BOC Calculated Items'!F40   -> 16
A190    = 'BOC Calculated Items'!B41   -> 50
B190    = 'BOC Calculated Items'!C41   -> 152
C190    = 'BOC Calculated Items'!D41   -> 19
D190    = 'BOC Calculated Items'!E41   -> 4
E190    = 'BOC Calculated Items'!F41   -> 19
A191    = 'BOC Calculated Items'!B42   -> 80
B191    = 'BOC Calculated Items'!C42   -> 191
C191    = 'BOC Calculated Items'!D42   -> 22
D191    = 'BOC Calculated Items'!E42   -> 4
E191    = 'BOC Calculated Items'!F42   -> 19
A192    = 'BOC Calculated Items'!B43   -> 100
B192    = 'BOC Calculated Items'!C43   -> 229
C192    = 'BOC Calculated Items'!D43   -> 22
D192    = 'BOC Calculated Items'!E43   -> 8
E192    = 'BOC Calculated Items'!F43   -> 19
A193    = 'BOC Calculated Items'!B44   -> 125
B193    = 'BOC Calculated Items'!C44   -> 254
C193    = 'BOC Calculated Items'!D44   -> 22
D193    = 'BOC Calculated Items'!E44   -> 8
E193    = 'BOC Calculated Items'!F44   -> 22
A194    = 'BOC Calculated Items'!B45   -> 150
B194    = 'BOC Calculated Items'!C45   -> 279
C194    = 'BOC Calculated Items'!D45   -> 22
D194    = 'BOC Calculated Items'!E45   -> 8
E194    = 'BOC Calculated Items'!F45   -> 22
A195    = 'BOC Calculated Items'!B46   -> 200
B195    = 'BOC Calculated Items'!C46   -> 343
C195    = 'BOC Calculated Items'!D46   -> 25
D195    = 'BOC Calculated Items'!E46   -> 8
E195    = 'BOC Calculated Items'!F46   -> 22
A196    = 'BOC Calculated Items'!B47   -> 250
B196    = 'BOC Calculated Items'!C47   -> 406
C196    = 'BOC Calculated Items'!D47   -> 28
D196    = 'BOC Calculated Items'!E47   -> 12
E196    = 'BOC Calculated Items'!F47   -> 25
A197    = 'BOC Calculated Items'!B48   -> 300
B197    = 'BOC Calculated Items'!C48   -> 483
C197    = 'BOC Calculated Items'!D48   -> 30
D197    = 'BOC Calculated Items'!E48   -> 12
E197    = 'BOC Calculated Items'!F48   -> 25
A198    = 'BOC Calculated Items'!B49   -> 350
B198    = 'BOC Calculated Items'!C49   -> 533
C198    = 'BOC Calculated Items'!D49   -> 33
D198    = 'BOC Calculated Items'!E49   -> 12
E198    = 'BOC Calculated Items'!F49   -> 29
A204    = 'BOC Calculated Items'!B64   -> "M-Size"
B204    = 'BOC Calculated Items'!C64   -> "Head Dia A (mm)"
C204    = 'BOC Calculated Items'!D64   -> "Head Height H (mm)"
D204    = 'BOC Calculated Items'!E64   -> "Key Size J (mm)"
A205    = 'BOC Calculated Items'!B65   -> "M3"
B205    = 'BOC Calculated Items'!C65   -> 5.5
C205    = 'BOC Calculated Items'!D65   -> 3
D205    = 'BOC Calculated Items'!E65   -> 2.5
A206    = 'BOC Calculated Items'!B66   -> "M4"
B206    = 'BOC Calculated Items'!C66   -> 7
C206    = 'BOC Calculated Items'!D66   -> 4
D206    = 'BOC Calculated Items'!E66   -> 3
A207    = 'BOC Calculated Items'!B67   -> "M5"
B207    = 'BOC Calculated Items'!C67   -> 8.5
C207    = 'BOC Calculated Items'!D67   -> 5
D207    = 'BOC Calculated Items'!E67   -> 4
A208    = 'BOC Calculated Items'!B68   -> "M6"
B208    = 'BOC Calculated Items'!C68   -> 10
C208    = 'BOC Calculated Items'!D68   -> 6
D208    = 'BOC Calculated Items'!E68   -> 5
A209    = 'BOC Calculated Items'!B69   -> "M8"
B209    = 'BOC Calculated Items'!C69   -> 13
C209    = 'BOC Calculated Items'!D69   -> 8
D209    = 'BOC Calculated Items'!E69   -> 6
A210    = 'BOC Calculated Items'!B70   -> "M10"
B210    = 'BOC Calculated Items'!C70   -> 16
C210    = 'BOC Calculated Items'!D70   -> 10
D210    = 'BOC Calculated Items'!E70   -> 8
A211    = 'BOC Calculated Items'!B71   -> "M12"
B211    = 'BOC Calculated Items'!C71   -> 18
C211    = 'BOC Calculated Items'!D71   -> 12
D211    = 'BOC Calculated Items'!E71   -> 10
A212    = 'BOC Calculated Items'!B72   -> "M14"
B212    = 'BOC Calculated Items'!C72   -> 21
C212    = 'BOC Calculated Items'!D72   -> 14
D212    = 'BOC Calculated Items'!E72   -> 12
A213    = 'BOC Calculated Items'!B73   -> "M16"
B213    = 'BOC Calculated Items'!C73   -> 24
C213    = 'BOC Calculated Items'!D73   -> 16
D213    = 'BOC Calculated Items'!E73   -> 14
A214    = 'BOC Calculated Items'!B74   -> "M20"
B214    = 'BOC Calculated Items'!C74   -> 30
C214    = 'BOC Calculated Items'!D74   -> 20
D214    = 'BOC Calculated Items'!E74   -> 17
A215    = 'BOC Calculated Items'!B75   -> "M24"
B215    = 'BOC Calculated Items'!C75   -> 36
C215    = 'BOC Calculated Items'!D75   -> 24
D215    = 'BOC Calculated Items'!E75   -> 19
A216    = 'BOC Calculated Items'!B76   -> "M30"
B216    = 'BOC Calculated Items'!C76   -> 45
C216    = 'BOC Calculated Items'!D76   -> 30
D216    = 'BOC Calculated Items'!E76   -> 22
A217    = 'BOC Calculated Items'!B77   -> "M36"
B217    = 'BOC Calculated Items'!C77   -> 54
C217    = 'BOC Calculated Items'!D77   -> 36
D217    = 'BOC Calculated Items'!E77   -> 27
B221    = 'Tie Rod'!B8   -> 125
B222    = 'Tie Rod'!B9   -> 250
B223    = 'Tie Rod'!B11   -> 294
B224    = 'Tie Rod'!B12   -> 3
B225    = 'Tie Rod'!B13   -> 98
B226    = 'Tie Rod'!B15   -> 306796.1576
B227    = 'Tie Rod'!B16   -> 76699.03939
B228    = 'Tie Rod'!B17   -> 782.6432591
B229    = 'Tie Rod'!B18   -> 31.56726702
B230    = 'Tie Rod'!B19   -> 35
B231    = 'Tie Rod'!B25   -> 150
A281    = Piston!G8   -> 50
B281    = Piston!H8   -> 50
C281    = Piston!I8   -> 30
A282    = Piston!G9   -> 63
B282    = Piston!H9   -> 63
C282    = Piston!I9   -> 40
A283    = Piston!G10   -> 80
B283    = Piston!H10   -> 80
C283    = Piston!I10   -> 50
A284    = Piston!G11   -> 100
B284    = Piston!H11   -> 100
C284    = Piston!I11   -> 60
A285    = Piston!G12   -> 125
B285    = Piston!H12   -> 125
C285    = Piston!I12   -> 75
A286    = Piston!G13   -> 150
B286    = Piston!H13   -> 150
C286    = Piston!I13   -> 90
A287    = Piston!G14   -> 160
B287    = Piston!H14   -> 160
C287    = Piston!I14   -> 100
A288    = Piston!G15   -> 180
B288    = Piston!H15   -> 180
C288    = Piston!I15   -> 110
A289    = Piston!G16   -> 200
B289    = Piston!H16   -> 200
C289    = Piston!I16   -> 120
A294    = 'Cap End Cover'!G18   -> 50
B294    = 'Cap End Cover'!H18   -> 68
C294    = 'Cap End Cover'!I18   -> 65
D294    = 'Cap End Cover'!J18   -> 65
E294    = 'Cap End Cover'!K18   -> 18
F294    = 'Cap End Cover'!L18   -> 65
A295    = 'Cap End Cover'!G19   -> 63
B295    = 'Cap End Cover'!H19   -> 85
C295    = 'Cap End Cover'!I19   -> 82
D295    = 'Cap End Cover'!J19   -> 82
E295    = 'Cap End Cover'!K19   -> 23
F295    = 'Cap End Cover'!L19   -> 82
A296    = 'Cap End Cover'!G20   -> 80
B296    = 'Cap End Cover'!H20   -> 108
C296    = 'Cap End Cover'!I20   -> 105
D296    = 'Cap End Cover'!J20   -> 105
E296    = 'Cap End Cover'!K20   -> 28
F296    = 'Cap End Cover'!L20   -> 105
A297    = 'Cap End Cover'!G21   -> 100
B297    = 'Cap End Cover'!H21   -> 135
C297    = 'Cap End Cover'!I21   -> 130
D297    = 'Cap End Cover'!J21   -> 130
E297    = 'Cap End Cover'!K21   -> 35
F297    = 'Cap End Cover'!L21   -> 130
A298    = 'Cap End Cover'!G22   -> 125
B298    = 'Cap End Cover'!H22   -> 168
C298    = 'Cap End Cover'!I22   -> 165
D298    = 'Cap End Cover'!J22   -> 165
E298    = 'Cap End Cover'!K22   -> 44
F298    = 'Cap End Cover'!L22   -> 165
A299    = 'Cap End Cover'!G23   -> 150
B299    = 'Cap End Cover'!H23   -> 200
C299    = 'Cap End Cover'!I23   -> 195
D299    = 'Cap End Cover'!J23   -> 195
E299    = 'Cap End Cover'!K23   -> 53
F299    = 'Cap End Cover'!L23   -> 195
A300    = 'Cap End Cover'!G24   -> 160
B300    = 'Cap End Cover'!H24   -> 215
C300    = 'Cap End Cover'!I24   -> 210
D300    = 'Cap End Cover'!J24   -> 210
E300    = 'Cap End Cover'!K24   -> 56
F300    = 'Cap End Cover'!L24   -> 210
A301    = 'Cap End Cover'!G25   -> 180
B301    = 'Cap End Cover'!H25   -> 240
C301    = 'Cap End Cover'!I25   -> 235
D301    = 'Cap End Cover'!J25   -> 235
E301    = 'Cap End Cover'!K25   -> 63
F301    = 'Cap End Cover'!L25   -> 235
A302    = 'Cap End Cover'!G26   -> 200
B302    = 'Cap End Cover'!H26   -> 265
C302    = 'Cap End Cover'!I26   -> 260
D302    = 'Cap End Cover'!J26   -> 260
E302    = 'Cap End Cover'!K26   -> 70
F302    = 'Cap End Cover'!L26   -> 260
A307    = 'Head End Cover'!G18   -> 50
B307    = 'Head End Cover'!H18   -> 68
C307    = 'Head End Cover'!I18   -> 65
D307    = 'Head End Cover'!J18   -> 65
E307    = 'Head End Cover'!K18   -> 18
F307    = 'Head End Cover'!L18   -> 65
A308    = 'Head End Cover'!G19   -> 63
B308    = 'Head End Cover'!H19   -> 85
C308    = 'Head End Cover'!I19   -> 82
D308    = 'Head End Cover'!J19   -> 82
E308    = 'Head End Cover'!K19   -> 23
F308    = 'Head End Cover'!L19   -> 82
A309    = 'Head End Cover'!G20   -> 80
B309    = 'Head End Cover'!H20   -> 108
C309    = 'Head End Cover'!I20   -> 105
D309    = 'Head End Cover'!J20   -> 105
E309    = 'Head End Cover'!K20   -> 28
F309    = 'Head End Cover'!L20   -> 105
A310    = 'Head End Cover'!G21   -> 100
B310    = 'Head End Cover'!H21   -> 135
C310    = 'Head End Cover'!I21   -> 130
D310    = 'Head End Cover'!J21   -> 130
E310    = 'Head End Cover'!K21   -> 35
F310    = 'Head End Cover'!L21   -> 130
A311    = 'Head End Cover'!G22   -> 125
B311    = 'Head End Cover'!H22   -> 168
C311    = 'Head End Cover'!I22   -> 165
D311    = 'Head End Cover'!J22   -> 165
E311    = 'Head End Cover'!K22   -> 44
F311    = 'Head End Cover'!L22   -> 165
A312    = 'Head End Cover'!G23   -> 150
B312    = 'Head End Cover'!H23   -> 200
C312    = 'Head End Cover'!I23   -> 195
D312    = 'Head End Cover'!J23   -> 195
E312    = 'Head End Cover'!K23   -> 53
F312    = 'Head End Cover'!L23   -> 195
A313    = 'Head End Cover'!G24   -> 160
B313    = 'Head End Cover'!H24   -> 215
C313    = 'Head End Cover'!I24   -> 210
D313    = 'Head End Cover'!J24   -> 210
E313    = 'Head End Cover'!K24   -> 56
F313    = 'Head End Cover'!L24   -> 210
A314    = 'Head End Cover'!G25   -> 180
B314    = 'Head End Cover'!H25   -> 240
C314    = 'Head End Cover'!I25   -> 235
D314    = 'Head End Cover'!J25   -> 235
E314    = 'Head End Cover'!K25   -> 63
F314    = 'Head End Cover'!L25   -> 235
A315    = 'Head End Cover'!G26   -> 200
B315    = 'Head End Cover'!H26   -> 265
C315    = 'Head End Cover'!I26   -> 260
D315    = 'Head End Cover'!J26   -> 260
E315    = 'Head End Cover'!K26   -> 70
F315    = 'Head End Cover'!L26   -> 260
A320    = Gland!G14   -> "RodDia Bin"
B320    = Gland!H14   -> "ID"
C320    = Gland!I14   -> "OD"
D320    = Gland!J14   -> "Length"
A321    = Gland!G15   -> 40
B321    = Gland!H15   -> 41
C321    = Gland!I15   -> 80
D321    = Gland!J15   -> 45
A322    = Gland!G16   -> 45
B322    = Gland!H16   -> 46
C322    = Gland!I16   -> 90
D322    = Gland!J16   -> 50
A323    = Gland!G17   -> 50
B323    = Gland!H17   -> 51
C323    = Gland!I17   -> 100
D323    = Gland!J17   -> 56
A324    = Gland!G18   -> 56
B324    = Gland!H18   -> 57
C324    = Gland!I18   -> 112
D324    = Gland!J18   -> 63
A325    = Gland!G19   -> 63
B325    = Gland!H19   -> 64
C325    = Gland!I19   -> 125
D325    = Gland!J19   -> 70
A326    = Gland!G20   -> 70
B326    = Gland!H20   -> 71
C326    = Gland!I20   -> 140
D326    = Gland!J20   -> 80
A327    = Gland!G21   -> 80
B327    = Gland!H21   -> 81
C327    = Gland!I21   -> 160
D327    = Gland!J21   -> 90
A328    = Gland!G22   -> 90
B328    = Gland!H22   -> 91
C328    = Gland!I22   -> 180
D328    = Gland!J22   -> 100
A333    = 'Cushion Bush'!G14   -> "RodDia Bin"
B333    = 'Cushion Bush'!H14   -> "OD"
C333    = 'Cushion Bush'!I14   -> "ID"
D333    = 'Cushion Bush'!J14   -> "Length"
A334    = 'Cushion Bush'!G15   -> 40
B334    = 'Cushion Bush'!H15   -> 56
C334    = 'Cushion Bush'!I15   -> 41
D334    = 'Cushion Bush'!J15   -> 32
A335    = 'Cushion Bush'!G16   -> 45
B335    = 'Cushion Bush'!H16   -> 63
C335    = 'Cushion Bush'!I16   -> 46
D335    = 'Cushion Bush'!J16   -> 36
A336    = 'Cushion Bush'!G17   -> 50
B336    = 'Cushion Bush'!H17   -> 70
C336    = 'Cushion Bush'!I17   -> 51
D336    = 'Cushion Bush'!J17   -> 40
A337    = 'Cushion Bush'!G18   -> 56
B337    = 'Cushion Bush'!H18   -> 78
C337    = 'Cushion Bush'!I18   -> 57
D337    = 'Cushion Bush'!J18   -> 45
A338    = 'Cushion Bush'!G19   -> 63
B338    = 'Cushion Bush'!H19   -> 88
C338    = 'Cushion Bush'!I19   -> 64
D338    = 'Cushion Bush'!J19   -> 50
A339    = 'Cushion Bush'!G20   -> 70
B339    = 'Cushion Bush'!H20   -> 98
C339    = 'Cushion Bush'!I20   -> 71
D339    = 'Cushion Bush'!J20   -> 56
A340    = 'Cushion Bush'!G21   -> 80
B340    = 'Cushion Bush'!H21   -> 112
C340    = 'Cushion Bush'!I21   -> 81
D340    = 'Cushion Bush'!J21   -> 64
A341    = 'Cushion Bush'!G22   -> 90
B341    = 'Cushion Bush'!H22   -> 126
C341    = 'Cushion Bush'!I22   -> 91
D341    = 'Cushion Bush'!J22   -> 72
A346    = 'Stop Tube'!G14   -> "RodDia Bin"
B346    = 'Stop Tube'!H14   -> "Raw Dia"
C346    = 'Stop Tube'!I14   -> "Finished Dia"
A347    = 'Stop Tube'!G15   -> 40
B347    = 'Stop Tube'!H15   -> 55
C347    = 'Stop Tube'!I15   -> 50
A348    = 'Stop Tube'!G16   -> 45
B348    = 'Stop Tube'!H16   -> 62
C348    = 'Stop Tube'!I16   -> 56
A349    = 'Stop Tube'!G17   -> 50
B349    = 'Stop Tube'!H17   -> 68
C349    = 'Stop Tube'!I17   -> 62
A350    = 'Stop Tube'!G18   -> 56
B350    = 'Stop Tube'!H18   -> 76
C350    = 'Stop Tube'!I18   -> 70
A351    = 'Stop Tube'!G19   -> 63
B351    = 'Stop Tube'!H19   -> 86
C351    = 'Stop Tube'!I19   -> 79
A352    = 'Stop Tube'!G20   -> 70
B352    = 'Stop Tube'!H20   -> 95
C352    = 'Stop Tube'!I20   -> 88
A353    = 'Stop Tube'!G21   -> 80
B353    = 'Stop Tube'!H21   -> 108
C353    = 'Stop Tube'!I21   -> 100
A354    = 'Stop Tube'!G22   -> 90
B354    = 'Stop Tube'!H22   -> 122
C354    = 'Stop Tube'!I22   -> 113
A359    = 'Rear Eye'!G15   -> "TubeOD Bin"
B359    = 'Rear Eye'!H15   -> "Thickness"
C359    = 'Rear Eye'!I15   -> "Width"
D359    = 'Rear Eye'!J15   -> "Height"
E359    = 'Rear Eye'!K15   -> "Pin Hole"
A360    = 'Rear Eye'!G16   -> 70
B360    = 'Rear Eye'!H16   -> 11
C360    = 'Rear Eye'!I16   -> 35
D360    = 'Rear Eye'!J16   -> 42
E360    = 'Rear Eye'!K16   -> 18
A361    = 'Rear Eye'!G17   -> 80
B361    = 'Rear Eye'!H17   -> 12
C361    = 'Rear Eye'!I17   -> 40
D361    = 'Rear Eye'!J17   -> 48
E361    = 'Rear Eye'!K17   -> 20
A362    = 'Rear Eye'!G18   -> 90
B362    = 'Rear Eye'!H18   -> 14
C362    = 'Rear Eye'!I18   -> 45
D362    = 'Rear Eye'!J18   -> 54
E362    = 'Rear Eye'!K18   -> 23
A363    = 'Rear Eye'!G19   -> 100
B363    = 'Rear Eye'!H19   -> 15
C363    = 'Rear Eye'!I19   -> 50
D363    = 'Rear Eye'!J19   -> 60
E363    = 'Rear Eye'!K19   -> 25
A364    = 'Rear Eye'!G20   -> 110
B364    = 'Rear Eye'!H20   -> 17
C364    = 'Rear Eye'!I20   -> 55
D364    = 'Rear Eye'!J20   -> 66
E364    = 'Rear Eye'!K20   -> 28
A365    = 'Rear Eye'!G21   -> 120
B365    = 'Rear Eye'!H21   -> 18
C365    = 'Rear Eye'!I21   -> 60
D365    = 'Rear Eye'!J21   -> 72
E365    = 'Rear Eye'!K21   -> 30
A366    = 'Rear Eye'!G22   -> 140
B366    = 'Rear Eye'!H22   -> 21
C366    = 'Rear Eye'!I22   -> 70
D366    = 'Rear Eye'!J22   -> 84
E366    = 'Rear Eye'!K22   -> 35
A367    = 'Rear Eye'!G23   -> 150
B367    = 'Rear Eye'!H23   -> 23
C367    = 'Rear Eye'!I23   -> 75
D367    = 'Rear Eye'!J23   -> 90
E367    = 'Rear Eye'!K23   -> 38
A368    = 'Rear Eye'!G24   -> 160
B368    = 'Rear Eye'!H24   -> 24
C368    = 'Rear Eye'!I24   -> 80
D368    = 'Rear Eye'!J24   -> 96
E368    = 'Rear Eye'!K24   -> 40
A369    = 'Rear Eye'!G25   -> 180
B369    = 'Rear Eye'!H25   -> 27
C369    = 'Rear Eye'!I25   -> 90
D369    = 'Rear Eye'!J25   -> 108
E369    = 'Rear Eye'!K25   -> 45
A374    = Flange!G11   -> "APPROXIMATE COSTING GEOMETRY - FINAL DIMENSIONS SUBJECT TO GA/DESIGN (Tube OD driven)"
B374    = Flange!H11   -> ""
C374    = Flange!I11   -> ""
A375    = Flange!G12   -> "This is the always-present round Flange (likely gland-retainer flange), separate from Front Flange mounting. OD=1.5x Tube OD, Length=0.3x Tube OD - lower confidence, no formal published source found."
B375    = Flange!H12   -> ""
C375    = Flange!I12   -> ""
A376    = Flange!G13   -> "TubeOD Bin"
B376    = Flange!H13   -> "OD"
C376    = Flange!I13   -> "Length"
A377    = Flange!G14   -> 70
B377    = Flange!H14   -> 105
C377    = Flange!I14   -> 21
A378    = Flange!G15   -> 80
B378    = Flange!H15   -> 120
C378    = Flange!I15   -> 24
A379    = Flange!G16   -> 90
B379    = Flange!H16   -> 135
C379    = Flange!I16   -> 27
A380    = Flange!G17   -> 100
B380    = Flange!H17   -> 150
C380    = Flange!I17   -> 30
A381    = Flange!G18   -> 110
B381    = Flange!H18   -> 165
C381    = Flange!I18   -> 33
A382    = Flange!G19   -> 120
B382    = Flange!H19   -> 180
C382    = Flange!I19   -> 36
A383    = Flange!G20   -> 140
B383    = Flange!H20   -> 210
C383    = Flange!I20   -> 42
A384    = Flange!G21   -> 150
B384    = Flange!H21   -> 225
C384    = Flange!I21   -> 45

## Cylinder Database  (12 formulas)
A5      = CONCATENATE("CYL-",TEXT(InquiryDate,"YYYYMMDD"))   -> "CYL-18991230"
B5      = InquiryNo   -> "INQ-0001"
C5      = CustomerName   -> ""
D5      = CylinderName   -> ""
E5      = Bore   -> 125
F5      = RodDia   -> 90
G5      = Stroke   -> 115
H5      = Mounting   -> "Rod Eye + Trunnion"
I5      = TotalManufacturingCost   -> 63384.10479
K5      = IFERROR(ActualTotalCost,0)   -> 0
L5      = IF(J5=0,0,(J5-I5)/J5)   -> 0
M5      = InquiryDate   -> ""

## Final Output  (12 formulas)
B1      = InquiryNo   -> "INQ-0001"
B3      = InquiryDate   -> ""
B4      = CustomerName   -> ""
B5      = CylinderName   -> ""
B6      = "Bore "&Bore&"mm x Rod "&RodDia&"mm x Stroke "&Stroke&"mm | "&Mounting   -> "Bore 125mm x Rod 90mm x Stroke 115mm | Rod Eye + Trunnion"
B8      = TotalCylinderWeight   -> 178.7657712
C11     = IFERROR(Tube_MaterialCost*Tube!$B$11,0)+IFERROR(PistonRod_MaterialCost*'Piston Rod'!$B$10,0)+IFERROR(CEC_MaterialCost*'Cap End Cover'!$B$13,0)+IFERROR(HEC_MaterialCost*'Head End Cover'!$B$13,0)+IFERROR(Gland_MaterialCost*Gland!$B$10,0)+IFERROR(CushionBush_MaterialCost*'Cushion Bush'!$B$10,0)+IFERROR(StopTube_MaterialCost*'Stop Tube'!$B$10,0)+IFERROR(RearEye_MaterialCost*'Rear Eye'!$B$11,0)+IFERROR(RodEye_MaterialCost*'Rod Eye'!$B$13,0)+IFERROR(Piston_MaterialCost*Piston!$B$9,0)+IFERROR(Flange_MaterialCost*Flange!$B$9,0)+IF(Mounting_Trunnion="Yes",IFERROR(Trunnion_MaterialCost*Trunnion!$B$10,0),0)+IF(Mounting_CECClevis="Yes",IFERROR(CECClevis_MaterialCost*'CEC Clevis'!$B$15,0),0)   -> 26735.42769
C12     = IFERROR(Tube_ProcessCost*Tube!$B$11,0)+IFERROR(PistonRod_ProcessCost*'Piston Rod'!$B$10,0)+IFERROR(CEC_ProcessCost*'Cap End Cover'!$B$13,0)+IFERROR(HEC_ProcessCost*'Head End Cover'!$B$13,0)+IFERROR(Gland_ProcessCost*Gland!$B$10,0)+IFERROR(CushionBush_ProcessCost*'Cushion Bush'!$B$10,0)+IFERROR(StopTube_ProcessCost*'Stop Tube'!$B$10,0)+IFERROR(RearEye_ProcessCost*'Rear Eye'!$B$11,0)+IFERROR(RodEye_ProcessCost*'Rod Eye'!$B$13,0)+IFERROR(Piston_ProcessCost*Piston!$B$9,0)+IFERROR(Flange_ProcessCost*Flange!$B$9,0)+IF(Mounting_Trunnion="Yes",IFERROR(Trunnion_ProcessCost*Trunnion!$B$10,0),0)+IF(Mounting_CECClevis="Yes",IFERROR(CECClevis_ProcessCost*'CEC Clevis'!$B$15,0),0)   -> 18701.89385
C13     = TotalBoughtOutCost   -> 360
C14     = TotalSealKitCost   -> 12188
C15     = AssemblyPaintingPackingTotal   -> 3900
C16     = SUM(C11:C15)   -> 61885.32154

## Machine Time Calculator  (31 formulas)
B9      = MATCH($B$7,{"Tube","Piston Rod","CEC","HEC","Gland","Cushion Bush","Stop Tube","Rear Eye","Rod Eye","Piston","Flange","Trunnion","CEC Clevis"},0)   -> 1
A13     = CHOOSE($B$9,"Raw OD (mm)","Raw Diameter (mm)","Finished OD (mm)","Finished OD (mm)","OD (mm)","OD (mm)","Raw Diameter (mm)","Weight (kg) (kg)","Weight (kg) (kg)","Weight (kg) (kg)","OD (mm)","Machined Width (mm)","(not used)")   -> "Raw OD (mm)"
A14     = CHOOSE($B$9,"Finished OD (mm)","Finished Diameter (mm)","Thickness (mm)","Thickness (mm)","Length (mm)","Length (mm)","Finished Diameter (mm)","Machined Width (mm)","Machined Width (mm)","Machined Width (mm)","Length (mm)","Machined Height (mm)","(not used)")   -> "Finished OD (mm)"
A15     = CHOOSE($B$9,"Finished ID (mm)","Length (mm)","Machined Width (mm)","Machined Width (mm)","Machined Width (mm)","(not used)","Length (mm)","Machined Height (mm)","Machined Height (mm)","Machined Height (mm)","Machined Width (mm)","Hole Diameter (mm)","(not used)")   -> "Finished ID (mm)"
A16     = CHOOSE($B$9,"Length (mm)","Machined Width (mm)","Machined Height (mm)","Machined Height (mm)","Machined Length (mm)","(not used)","(not used)","Hole Diameter (mm)","Hole Diameter (mm)","Hole Diameter (mm)","Machined Height (mm)","No. of Holes ()","(not used)")   -> "Length (mm)"
A17     = CHOOSE($B$9,"(not used)","Machined Length (mm)","Hole Diameter (mm)","Hole Diameter (mm)","Hole Diameter (mm)","(not used)","(not used)","No. of Holes ()","No. of Holes ()","No. of Holes ()","Hole Diameter (mm)","(not used)","(not used)")   -> "(not used)"
A18     = CHOOSE($B$9,"(not used)","(not used)","No. of Holes ()","No. of Holes ()","No. of Holes ()","(not used)","(not used)","(not used)","(not used)","(not used)","No. of Holes ()","(not used)","(not used)")   -> "(not used)"
A22     = CHOOSE($B$9,"Cutting","Cutting","Turning","Turning","Turning","Turning","Turning","Profile Cutting","Profile Cutting","Profile Cutting","Turning","Rough Turning","(no Machine Time Master process defined yet)")   -> "Cutting"
B22     = CHOOSE($B$9,"Cutting Machine","Cutting Machine","CNC Lathe","CNC Lathe","CNC Lathe","CNC Lathe","CNC Lathe","Cutting Machine","Cutting Machine","Cutting Machine","CNC Lathe","Conventional Lathe","-")   -> "Cutting Machine"
C22     = CHOOSE($B$9,INDEX(CuttingTable,MATCH($B$13,CuttingODBins,1),MATCH($B$16,CuttingLenBins,1)),INDEX(CuttingTable,MATCH($B$13,CuttingODBins,1),MATCH($B$15,CuttingLenBins,1)),INDEX(RoughTurningTable,MATCH($B$13,TurningODBins,1),MATCH($B$14,TurningLenBins,1)),INDEX(RoughTurningTable,MATCH($B$13,TurningODBins,1),MATCH($B$14,TurningLenBins,1)),INDEX(RoughTurningTable,MATCH($B$13,TurningODBins,1),MATCH($B$14,TurningLenBins,1)),INDEX(RoughTurningTable,MATCH($B$13,TurningODBins,1),MATCH($B$14,TurningLenBins,1)),INDEX(RoughTurningTable,MATCH($B$14,TurningODBins,1),MATCH($B$15,TurningLenBins,1))*VLOOKUP(($B$13-$B$14),StockRemovalTable,3,TRUE()),VLOOKUP($B$13,ProfileCuttingTimeTable,3,TRUE()),VLOOKUP($B$13,ProfileCuttingTimeTable,3,TRUE()),VLOOKUP($B$13,ProfileCuttingTimeTable,3,TRUE()),INDEX(RoughTurningTable,MATCH($B$13,TurningODBins,1),MATCH($B$14,TurningLenBins,1)),"TIME STANDARD NOT AVAILABLE","TIME STANDARD NOT AVAILABLE")   -> 0.08
A23     = CHOOSE($B$9,"Rough Turning","Rough Turning","Milling","Milling","Milling","Grinding (ID bore)","","Milling","Milling","Milling","Milling","Finished Turning","")   -> "Rough Turning"
B23     = CHOOSE($B$9,"Conventional Lathe","CNC Lathe","Milling Machine","Milling Machine","Milling Machine","Grinding Machine","","Milling Machine","Milling Machine","Milling Machine","Milling Machine","CNC Lathe","")   -> "Conventional Lathe"
C23     = CHOOSE($B$9,INDEX(RoughTurningTable,MATCH($B$14,TurningODBins,1),MATCH($B$16,TurningLenBins,1))*VLOOKUP(($B$13-$B$14),StockRemovalTable,3,TRUE()),INDEX(RoughTurningTable,MATCH($B$14,TurningODBins,1),MATCH($B$15,TurningLenBins,1))*VLOOKUP(($B$13-$B$14),StockRemovalTable,3,TRUE()),VLOOKUP($B$15*$B$16,MillingTable,3,TRUE()),VLOOKUP($B$15*$B$16,MillingTable,3,TRUE()),VLOOKUP($B$15*$B$16,MillingTable,3,TRUE()),"TIME STANDARD NOT AVAILABLE","",VLOOKUP($B$14*$B$15,MillingTable,3,TRUE()),VLOOKUP($B$14*$B$15,MillingTable,3,TRUE()),VLOOKUP($B$14*$B$15,MillingTable,3,TRUE()),VLOOKUP($B$15*$B$16,MillingTable,3,TRUE()),"TIME STANDARD NOT AVAILABLE","")   -> 0.3
A24     = CHOOSE($B$9,"Boring","Finish Turning","Drilling","Drilling","Drilling","","","Drilling","Drilling","Drilling","Drilling","Pin Grinding","")   -> "Boring"
B24     = CHOOSE($B$9,"Conventional Lathe","CNC Lathe","Drilling Machine","Drilling Machine","Drilling Machine","","","Drilling Machine","Drilling Machine","Drilling Machine","Drilling Machine","Grinding Machine","")   -> "Conventional Lathe"
C24     = CHOOSE($B$9,INDEX(BoringTable,MATCH($B$15,BoringIDBins,1),MATCH($B$16,BoringLenBins,1)),INDEX(RoughTurningTable,MATCH($B$14,TurningODBins,1),MATCH($B$15,TurningLenBins,1))*0.7,VLOOKUP($B$17,DrillingTable,3,TRUE())*$B$18,VLOOKUP($B$17,DrillingTable,3,TRUE())*$B$18,VLOOKUP($B$17,DrillingTable,3,TRUE())*$B$18,"","",VLOOKUP($B$16,DrillingTable,3,TRUE())*$B$17,VLOOKUP($B$16,DrillingTable,3,TRUE())*$B$17,VLOOKUP($B$16,DrillingTable,3,TRUE())*$B$17,VLOOKUP($B$17,DrillingTable,3,TRUE())*$B$18,"TIME STANDARD NOT AVAILABLE","")   -> 0.25
A25     = CHOOSE($B$9,"Finish Turning","Milling","","","Grinding (ID bore)","","","","","","","Milling","")   -> "Finish Turning"
B25     = CHOOSE($B$9,"CNC Lathe","Milling Machine","","","Grinding Machine","","","","","","","Milling Machine","")   -> "CNC Lathe"
C25     = CHOOSE($B$9,INDEX(RoughTurningTable,MATCH($B$14,TurningODBins,1),MATCH($B$16,TurningLenBins,1))*0.7,VLOOKUP($B$16*$B$17,MillingTable,3,TRUE()),"","","TIME STANDARD NOT AVAILABLE","","","","","","",VLOOKUP($B$13*$B$14,MillingTable,3,TRUE()),"")   -> 0.21
A26     = CHOOSE($B$9,"Honing","","","","","","","","","","","Drilling","")   -> "Honing"
B26     = CHOOSE($B$9,"Honing Machine","","","","","","","","","","","Drilling Machine","")   -> "Honing Machine"
C26     = CHOOSE($B$9,"TIME STANDARD NOT AVAILABLE","","","","","","","","","","",VLOOKUP($B$15,DrillingTable,3,TRUE())*$B$16,"")   -> "TIME STANDARD NOT AVAILABLE"
C27     = SUM(C22:C26)   -> 0.84
B31     = SUMIF(B22:B26,"CNC Lathe",C22:C26)   -> 0.21
B32     = SUMIF(B22:B26,"Conventional Lathe",C22:C26)   -> 0.55
B33     = SUMIF(B22:B26,"Milling Machine",C22:C26)   -> 0
B34     = SUMIF(B22:B26,"Drilling Machine",C22:C26)   -> 0
B35     = SUMIF(B22:B26,"Honing Machine",C22:C26)   -> 0
B36     = SUMIF(B22:B26,"Grinding Machine",C22:C26)   -> 0
B37     = SUMIF(B22:B26,"Cutting Machine",C22:C26)   -> 0.08
B38     = SUM(B31:B37)   -> 0.84

## BOC Calculated Items  (27 formulas)
C24     = VLOOKUP(C23,Sch40Table,3,FALSE())   -> 114.3
C25     = VLOOKUP(C23,Sch40Table,4,FALSE())   -> 6.02
C28     = (C24-C25)*C25*0.02466   -> 16.0745125
C29     = C28*C26*C27   -> 16.0745125
C30     = INDEX(MaterialMaster_Range,MATCH("MS-ST52",INDEX(MaterialMaster_Range,0,1),0),4)   -> 160
C31     = C29*C30   -> 2571.921999
C52     = VLOOKUP(C51,PipeFlangeTable,2,FALSE())   -> 229
C53     = VLOOKUP(C51,PipeFlangeTable,3,FALSE())   -> 22
C54     = C24   -> 114.3
C56     = (PI()/4)*(C52)^2*C53   -> 906115.4319
C57     = (PI()/4)*(C54)^2*C53   -> 225738.1819
C58     = (C56-C57)*INDEX(MaterialMaster_Range,MATCH("MS-PLATE-IS2062",INDEX(MaterialMaster_Range,0,1),0),3)/1000000   -> 5.340961412
C59     = C58*INDEX(MaterialMaster_Range,MATCH("MS-PLATE-IS2062",INDEX(MaterialMaster_Range,0,1),0),4)*C55   -> 453.98172
C79     = VALUE(MID(C78,2,10))   -> 12
C80     = VLOOKUP(C78,UnbrakoTable,2,FALSE())   -> 18
C81     = VLOOKUP(C78,UnbrakoTable,3,FALSE())   -> 12
C84     = (PI()/4)*(C80)^2*C81   -> 3053.628059
C85     = (PI()/4)*(C79)^2*C82   -> 4523.893421
C86     = (C84+C85)*INDEX(MaterialMaster_Range,MATCH("MS-EN19",INDEX(MaterialMaster_Range,0,1),0),3)/1000000   -> 0.05948354362
C88     = C86*C87*C83   -> 23.79341745
C93     = RodDia   -> 90
C94     = 1.4*C93   -> 126
C95     = Stroke+100   -> 215
C98     = C97*C96   -> 0
C105    = (PI()/4)*(C102)^2*C103*INDEX(MaterialMaster_Range,MATCH("MS-PLATE-IS2062",INDEX(MaterialMaster_Range,0,1),0),3)/1000000   -> 1.233075117
C106    = C105*INDEX(MaterialMaster_Range,MATCH("MS-PLATE-IS2062",INDEX(MaterialMaster_Range,0,1),0),4)*C104   -> 104.8113849
C109    = BOC_Pipe_TotalCost+BOC_PipeFlange_TotalCost+BOC_Bolt_TotalCost+BOC_Bellows_TotalCost+BOC_FlangeComponent_TotalCost   -> 3154.508522
