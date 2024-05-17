CREATE TABLE IF NOT EXISTS Users (
    userId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL,
    password TEXT NOT NULL,
    dateJoined DATE DEFAULT CURRENT_DATE,
    isAdmin BOOLEAN
);

CREATE TABLE IF NOT EXISTS Scores (
    gameId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    score INT NOT NULL,
    attemptDate DATE DEFAULT CURRENT_DATE,
    FOREIGN KEY (userId) REFERENCES Users(userId)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS StructureQ (
    structureId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    molecule TEXT NOT NULL,
    answer VARCHAR(30) NOT NULL,
    incorrect1 VARCHAR(30) NOT NULL,
    incorrect2 VARCHAR(30) NOT NULL,
    incorrect3 VARCHAR(30) NOT NULL,
    difficulty INT NOT NULL
);

CREATE TABLE IF NOT EXISTS ReactionQ (
    reactionId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    reactant TEXT NOT NULL,
    reagent TEXT,
    productSmile TEXT NOT NULL,
    productInchi TEXT NOT NULL,
    catalyst TEXT,
    solvent TEXT,
    temperature TEXT,
    time TEXT,
    difficulty INT NOT NULL
);

INSERT INTO Users (username, password, isAdmin)
VALUES
("student", "$2y$10$0DTKrN1.96bSniLN85bQoeNjF8bVEUsMAKlhyxg9P/GWxn5gDQGr.", 0), 
("admin", "$2y$10$0DTKrN1.96bSniLN85bQoeNjF8bVEUsMAKlhyxg9P/GWxn5gDQGr.", 1);

INSERT INTO StructureQ (
    molecule,
    answer,
    incorrect1,
    incorrect2,
    incorrect3,
    difficulty
)
VALUES
('c1ccccc1', 'benzene', 'toluene', 'methanol', 'ethanol', 0),
('CCO', 'ethanol', 'methanol', 'propanol', 'tert-butanol', 0),
('CN', 'methylamine', 'ethylamine', 'propylamine', 'butylamine', 0),
('C1CCCC1', 'cyclopentane', 'cyclopentene', 'cyclohexane', 'cyclohexene', 0),
('CN4CC[C@]23c1c5ccc(O)c1O[C@H]2[C@@H](O)C=C[C@H]3[C@H]4C5', 'morphine', 'aspirin', 'codeine', 'heroin', 1),
('CC(=O)Oc1ccc2C[C@@H]5[C@@H]3C=C[C@H](OC(C)=O)[C@@H]4Oc1c2[C@]34CCN5C', 'heroin', 'morphine', 'oxycodone', 'cocaine', 1),
('COC(=O)[C@H]2[C@@H](OC(=O)c1ccccc1)C[C@@H]3CC[C@H]2N3C', 'cocaine', 'dopamine', 'caffeine', 'ethanol', 1),
('Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'caffeine', 'ethanol', 'cocaine', 'heroin', 1),
('ClCCl', 'dichloromethane', 'chloromethane', 'chloroform', 'carbon tetrachloride', 0),
('C#C', 'ethyne', 'alkyne', 'alkene', 'alkane', 0),
('C[C@@H](N)C(=O)O', 'alanine', 'glycine', 'phenylalanine', 'proline', 0),
('c1ccncc1', 'pyridine', 'pyrimidine', 'pyrine', '2,6-lutidine', 0),
('O=C(O)C(F)(F)F', 'trifluoroacetic acid', 'acetic acid', 'ethanoic acid', 'triflic acid', 0),
('CC(C)(C)S', 'tert-butylthiol', 'tert-butanol', 'n-butanol', 'n-butylthiol', 0),
('O=Cc1ccccc1', 'benzaldehyde', 'benzyl alcohol', 'benzoic acid', 'benzoin', 0),
('CC(=O)Oc1ccccc1C(=O)O', 'aspirin', 'paracetamol', 'ibuprofen', 'methyl salicylate', 1),
('Cc1c(N(=O)=O)cc(N(=O)=O)cc1N(=O)=O', 'trinitrotoluene', 'dinitrotoluene', 'nitroglycerine', 'acetone peroxide', 1),
('COP(=O)(OC)C(=N#N)C(C)=O', 'Ohira-Bestmann reagent', 'Corey-Fuchs reagent', 'Shibasaki-Kumagai reagent', 'HWE reagent', 1),
('COc1cc(CNC(=O)CCCC/C=C/C(C)C)ccc1O', 'capsaicin', 'mustard gas', 'nonivamide', 'allicin', 1),
('NCCc1c[nH]c2ccc(O)cc12', 'serotonin', 'methamphetamine', 'tryptophan', 'safrole', 1),
('CN1CCC[C@H]1c2cccnc2', 'nicotine', 'nylon', 'napthylene', 'normorphine', 1);

INSERT INTO ReactionQ (
    reactant, 
    reagent, 
    productSmile, 
    productInchi, 
    catalyst, 
    solvent, 
    temperature, 
    time, 
    difficulty
) 
VALUES
('CC(=O)O', 'NCc1ccccc1', 'CC(=O)NCc1ccccc1', 'InChI=1S/C9H11NO/c1-8(11)10-7-9-5-3-2-4-6-9/h2-6H,7H2,1H3,(H,10,11)', 'PyBOP', 'THF', 25, 1, 1),
('CC(C)=O', 'N#C[Na]', 'CC(C)(O)C#N', 'InChI=1S/C4H7NO/c1-4(2,6)3-5/h6H,1-2H3', 'H2SO4', 'H2O', NULL, NULL, 0),
('O=C1CCCCC1', '', 'OC1CCCCC1', 'InChI=1S/C6H12O/c7-6-4-2-1-3-5-6/h6-7H,1-5H2', 'NaBH4', 'iPrOH', NULL, NULL, 0),
('C/C(C)=C(C)C', 'BrBr', 'CC(C)(Br)C(C)(C)Br', 'InChI=1S/C6H12Br2/c1-5(2,7)6(3,4)8/h1-4H3', '', '', NULL, NULL, 0),
('c1ccccc1', 'BrBr', 'Brc1ccccc1', 'InChI=1S/C6H5Br/c7-6-4-2-1-3-5-6/h1-5H', 'FeBr3', '', NULL, NULL, 0),
('CCC(C)=O', 'Br[Mg]c1ccccc1', 'CCC(C)(O)c1ccccc1', 'InChI=1S/C10H14O/c1-3-10(2,11)9-7-5-4-6-8-9/h4-8,11H,3H2,1-2H3', '', 'THF', 0, 1, 0),
('COCOc1cccc(C)c1', 'O=C=O', 'COCOc1cc(C)ccc1C(=O)O', 'InChI=1S/C10H12O4/c1-7-3-4-8(10(11)12)9(5-7)14-6-13-2/h3-5H,6H2,1-2H3,(H,11,12)', '', '', NULL, NULL, 1),
('CC(=O)Cc1ccccc1', 'CN', 'CNC(C)Cc1ccccc1', 'InChI=1S/C10H15N/c1-9(11-2)8-10-6-4-3-5-7-10/h3-7,9,11H,8H2,1-2H3', 'Al/Hg', '', NULL, NULL, 1),
('C=CC=C', 'COc1cc(=O)c(C)cc1=O', 'COC2=CC(=O)C1(C)CC=CCC1(C)C2=O', 'InChI=1S/C13H16O3/c1-12-6-4-5-7-13(12,2)11(15)9(16-3)8-10(12)14/h4-5,8H,6-7H2,1-3H3', '', 'toluene', 100, 96, 1),
('CCCC#C[Si](C)(C)C(C)(C)C', '', 'C#CCCC', 'InChI=1S/C5H8/c1-3-5-4-2/h1H,4-5H2,2H3', 'TBAF', 'THF', 25, 1, 0),
('COC(=O)C(Cc1ccccc1)NC(=O)OC(C)(C)C', '', 'COC(=O)C(N)Cc1ccccc1', 'InChI=1S/C10H13NO2/c1-13-10(12)9(11)7-8-5-3-2-4-6-8/h2-6,9H,7,11H2,1H3', 'CF3COOH', 'DCM', 25, 1, 0),
('CC1(C)CC(=O)CC(=O)C1', 'O=S(=O)(OS(=O)(=O)C(F)(F)F)C(F)(F)F', 'CC1(C)CC(=O)C=C(OS(=O)(=O)C(F)(F)F)C1', 'InChI=1S/C9H11F3O4S/c1-8(2)4-6(13)3-7(5-8)16-17(14,15)9(10,11,12)/h3H,4-5H2,1-2H3', 'C5H5N', 'DCM', -78, NULL, 1),
('O=c2c1ccccc1c3ccccc23', 'NN', 'NN=c2c1ccccc1c3ccccc23', 'InChI=1S/C13H10N2/c14-15-13-11-7-3-1-5-9(11)10-6-2-4-8-12(10)13/h1-8H,14H2', '', 'EtOH', -78, NULL, 0),
('Nc1ccccc1Br', 'OB(O)c1ccccc1', 'Nc1ccccc1c2ccccc2', 'InChI=1S/C12H11N/c13-12-9-5-4-8-11(12)10-6-2-1-3-7-10/h1-9H,13H2', 'Pd(PPh3)4', 'toluene/EtOH/H2O', NULL, 16, 1),
('N#CCc1ccccc1', '', 'CCOC(=O)Cc1ccccc1', 'InChI=1S/C10H12O2/c1-2-12-10(11)8-9-6-4-3-5-7-9/h3-7H,2,8H2,1H3', 'H2SO4', 'EtOH', 78, 6, 0),
('Oc2ccc1ccccc1c2', 'O=NO[Na]', 'O=Nc1c(O)ccc2ccccc12', 'InChI=1S/C10H7NO2/c12-9-6-5-7-3-1-2-4-8(7)10(9)11-13/h1-6,12H', 'H2SO4', 'H2O/NaOH', 0, 2, 1),
('Br/C=C/c1ccccc1', '', 'C#Cc1ccccc1', 'InChI=1S/C8H6/c1-2-8-6-4-3-5-7-8/h1,3-7H', 'KOH', '', 200, NULL, 1),
('O=c1oc(=O)c2ccccc12', '', 'O=c1[nH]c(=O)c2ccccc12', 'InChI=1S/C8H5NO2/c10-7-5-3-1-2-4-6(5)8(11)9-7/h1-4H,(H,9,10,11)', 'NH4OH', 'H2O', 300, NULL, 0),
('Cc1cc(C)c(N)c(C)c1', 'O=CC=O', 'Cc2cc(C)c(/N=C/C=N/c1c(C)cc(C)cc1C)c(C)c2', 'InChI=1S/C20H24N2/c1-13-9-15(3)19(16(4)10-13)21-7-8-22-20-17(5)11-14(2)12-18(20)6/h7-12H,1-6H3/b21-7+,22-8+', '', 'iPrOH, H2O', NULL, 24, 1),
('C[Si](C)(C)c1ccccc1OS(=O)(=O)C(F)(F)F', 'CCOC(=O)C=N#N', 'CCOC(=O)c1n[nH]c2ccccc12', 'InChI=1S/C10H10N2O2/c1-2-14-10(13)9-7-5-3-4-6-8(7)11-12-9/h3-6H,2H2,1H3,(H,11,12)', 'TBAF', 'THF', 25, 1, 1);


