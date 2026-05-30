export interface CurriculumLevelData {
  scope: string;
  difficultyRating: string;
  subTopics: string[];
}

export interface SubjectCurriculum {
  subject: string;
  levels: Record<string, CurriculumLevelData>;
}

export class CurriculumManager {
  private static defaultTopics: Record<string, string[]> = {
    "Accounting": ["Principles of Accounting", "Ledger Accounts", "Final Accounts", "Partnership Accounts", "Company Accounts", "Cost Accounting"],
    "Agricultural Science": ["Soil Science", "Crop Production", "Animal Husbandry", "Agricultural Economics", "Farm Tools", "Irrigation & Drainage"],
    "Anatomy": ["Gross Anatomy", "Histology Core", "Embryology Base", "Neuroanatomy Intro", "Musculoskeletal System", "Cardiovascular Anatomy"],
    "Anatomy: Extremities (Locomotor)": ["Pectoral Girdle & Axilla", "Brachial Plexus & Arm Anatomy", "Forearm & Hand compartments", "Gluteal Region & Thigh", "Popliteal Fossa & Leg", "Ankle, Foot & Joint Mechanics"],
    "Basic Science": ["Living & Non-Living Things", "Matter & Energy", "The Human Body", "Environment", "Reproductive Health", "Forces & Motion"],
    "Basic Technology": ["General Woodwork", "Metalwork", "Energy & Power", "Building Technology", "Technical Drawing Intro", "Electrical Wiring Basics"],
    "Biochemistry": ["Metabolism", "Enzymology", "Cell Signaling", "Molecular Biology Techniques", "Structure of Biomolecules", "Bioenergetics"],
    "Biology": ["Cell Biology", "Genetics", "Ecology", "Evolutionary Biology", "Plant Physiology", "Systematics & Taxonomy"],
    "Biotechnology": ["Genomics", "Proteomics", "Bioinformatics", "Environmental Biotech", "Plant Biotechnology", "Recombinant DNA Tools"],
    "Botany": ["Plant Anatomy", "Photosynthesis", "Plant Reproduction", "Systematics", "Plant Ecology", "Plant Biochemistry"],
    "Business Studies": ["Office Practice", "Commerce Principles", "Bookkeeping", "Keyboarding", "Entrepreneurship", "Business Ethics"],
    "Cardiovascular, Blood & Lymphatics (CBD)": ["Myocardial Contraction Mechanism", "Cardiac Cycle & Pressures", "RBC, WBC & Platelet Hemostasis", "Lymphatic Drainage & Spleen", "Anatomy of Great Vessels", "Electrophysiology & ECG Leads"],
    "Cardiovascular & Respiratory Systems (CV/RS)": ["Anatomy of Coronary & Bronchial Circulation", "Cardiac Output Regulation", "Pulmonary Ventilation Mechanics", "Alveolar Gas Exchange & Diffusion", "Acid-Base Regulation & Buffers", "Cardiorespiratory Reflex Controls"],
    "Chemical Engineering": ["Mass Transfer", "Heat Transfer", "Chemical Reaction Engineering", "Process Control", "Separation Processes", "Transport Phenomena"],
    "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Thermodynamics", "Chemical Bonding", "Acids & Bases", "Kinetics & Equilibrium"],
    "Civic Education": ["Human Rights", "Rule of Law", "Nationalism", "Citizenship", "Community Service", "National Values"],
    "Civil Engineering": ["Structural Analysis", "Geotechnical Engineering", "Transportation", "Water Resources", "Environmental Engineering", "Concrete Technology"],
    "Clinical Biochemistry": ["Liver Function Tests", "Renal Function biomarkers", "Serum Lipids & Cardiac markers", "Endocrinological Assays", "Tumor Markers", "Acid-Base & Electrolyte panels"],
    "Clinical Immunology": ["Hypersensitivity Reactions", "Autoimmune Diseases", "Primary Immunodeficiencies", "Transplantation Immunology", "Cancer Immunotherapy", "Immunoserological Testing"],
    "Commerce": ["Home Trade", "Foreign Trade", "Banking & Finance", "Insurance", "Advertising", "Warehousing"],
    "Community Medicine": ["Epidemiology", "Biostatistics", "Environmental Health", "Health Management", "Primary Health Care", "Maternal & Child Health"],
    "Computer Engineering": ["Computer Architecture", "Digital Logic Design", "Microprocessors", "Embedded Systems", "Operating Systems", "Networking Hardware"],
    "CRK": ["Creation", "The Exodus", "The Prophets", "Life of Jesus", "The Early Church", "Christian Living"],
    "Current Affairs": ["Nigerian Governance History", "Global Organizations (UN, AU)", "Geopolitics", "Economic Policies", "Recent Innovations", "National Icons"],
    "Dermatology": ["Skin Anatomy", "Bacterial Infections", "Fungal Infections", "Parasitic Infestations", "Acne & Rosacea", "Skin Malignancies"],
    "Economics": ["Microeconomics", "Macroeconomics", "International Trade", "Development Economics", "Monetary Policy", "Public Finance"],
    "Electrical Engineering": ["Circuit Theory", "Power Systems", "Electronics", "Signal Processing", "Electromagnetic Fields", "Control Systems"],
    "Embryology": ["Gametogenesis", "Fertilization", "Cleavage & Gastrulation", "Organogenesis", "Notochord Development", "Placental Development"],
    "English": ["Reading Comprehension", "Lexis and Structure", "Sentence Interpretation", "Antonyms & Synonyms", "Oral English", "Essay & Letter Writing"],
    "English Literature": ["African Drama", "African Poetries", "Non-African Prose", "Literary Devices & Styles", "Shakespearean Works", "Modern African Novels"],
    "ENT": ["Otology", "Rhinology", "Laryngology", "Head & Neck Surgery", "Pediatric Otolaryngology", "Audiology Basics"],
    "Fine Art": ["Drawing & Painting Styles", "Sculpting & Ceramics", "History of Nigerian Art (Nok, Ife)", "Graphic Design Basics", "Textile Design & Batik", "Art Criticism & Theory"],
    "Fluid Mechanics": ["Fluid Statics", "Bernoulli's Equation", "Viscous Flow", "Turbomachinery", "Boundary Layer", "Dimensional Analysis"],
    "Food Science": ["Food Chemistry", "Food Microbiology", "Food Preservation & Processing", "Nutrition & Health", "Sensory Evaluation", "Food Quality Assurance"],
    "French": ["French Grammar & Conjugations", "Vocabulary in Context", "French Composition", "Oral French & Phonology", "Francophone African Literature", "French Translation Skills"],
    "Further Mathematics": ["Calculus", "Vectors", "Matrices", "Complex Numbers", "Probability Distributions", "Coordinate Geometry"],
    "Genetics": ["Mendelian Genetics", "Molecular Genetics", "Population Genetics", "Cytogenetics", "Recombinant DNA Technology", "Bioinformatics"],
    "Geography": ["Map Work", "Climatology", "Human Geography", "Economic Geography", "Regional Geography of Nigeria", "Geomorphology"],
    "Geology": ["Mineralogy", "Petrology", "Structural Geology", "Stratigraphy", "Paleontology", "Economic Geology"],
    "Geophysics": ["Seismic Prospecting", "Gravity Method", "Magnetic Surveying", "Electrical Resistivity", "Electromagnetic Methods", "Borehole Geophysics"],
    "Hausa": ["Al'adun Hausa", "Adabin Hausa", "Harshen Hausa", "Aroko Hausa", "Karin Magana", "Wakokin Hausa"],
    "Hematology": ["Anemia Types", "Coagulation Disorders", "Leukemia & Lymphoma", "Blood Transfusion", "Bone Marrow Physiology", "Hemoglobinopathies"],
    "History": ["Pre-Colonial Nigerian Kingdoms", "Trans-Atlantic Slave Trade", "British Colonization & Amalgamation", "Nigeria Independence Movement", "Post-Independence & Civil War", "Modern African History"],
    "Home Economics": ["Food & Nutrition", "Clothing & Textiles", "Home Management", "Child Development", "Consumer Education", "Interior Decoration"],
    "Igbo": ["Agumagu Igbo", "Omenala Igbo", "Ito Igbo", "Utasusu Igbo (Girama)", "Ederede Igbo", "Ilu Na Akpa Okwu"],
    "Infectious Diseases System (IDS)": ["Host-Pathogen Interactions", "Bacterial Staining & Gram Classification", "Viral Replication Cycles", "Systemic Mycoses", "Protozoan & Helminthic Parasites", "Infectious Disease Surveillance / Infection Control"],
    "Insurance": ["Principles of Insurance", "Life & Health Insurance", "Marine & Aviation Insurance", "Motor & Property Insurance", "Reinsurance Basics", "Risk Management Principles"],
    "Internal Medicine": ["Cardiology", "Pulmonology", "Gastroenterology", "Endocrinology", "Rheumatology", "Infectious Diseases", "Nephrology", "Neurology"],
    "IRK": ["Fundamentals of Islam", "Hadith", "Sharia Law", "History of Islam", "Islamic Ethics", "Quranic Text Studies"],
    "Mathematics": ["Algebra", "Euclidean Geometry", "Trigonometry", "Statistics & Probability", "Calculus Principles", "Indices and Logarithms"],
    "Mechanical Engineering": ["Machine Design", "Thermodynamics", "Manufacturing Processes", "Control Systems", "Mechatronics", "Strength of Materials"],
    "Medical Biochemistry": ["Enzymology", "Glycolysis & Krebs Cycle", "Lipid Metabolism", "Protein Synthesis & Translation", "DNA Replication", "Hormonal Biochemistry"],
    "Medical Histology": ["Epithelial Tissue", "Connective Tissue", "Muscle Tissue", "Nervous Tissue", "Respiratory Histology", "Organ Histology"],
    "Medical Microbiology": ["Bacteriology", "Virology", "Mycology", "Diagnostic Techniques", "Antibiotic Resistance", "Parasitology Basics"],
    "Medical Parasitology": ["Plasmodium & Malaria", "Schistosoma & Bilharziasis", "Soil-Transmitted Helminths", "Protozoan Infections (Amoeba, Giardia)", "Arthropod Vectors of Disease", "Laboratory Diagnostics of Parasites"],
    "Medicine": ["General Pathological Principles", "Respiratory Diseases", "Cardiovascular Diagnostics", "Renal System Pathologies", "Endocrine Disorders", "CNS Infections & Diagnosis"],
    "Meteorology": ["Atmospheric Thermodynamics", "Synoptic Meteorology", "Climatology", "Cloud Physics", "Dynamic Meteorology", "Remote Sensing"],
    "Microbiology": ["Microbial Genetics", "Industrial Microbiology", "Immunology", "Environmental Microbiology", "Medical Bacteriology", "Microbial Physiology"],
    "Molecular Biology": ["DNA Replication", "Transcription & RNA Processing", "Translation & Protein Folding", "Gene Regulation", "Recombinant DNA Tech", "Genomics & PCR"],
    "Neuroanatomy": ["Cerebral Cortex", "Brainstem & Cranial Nerves", "Spinal Cord Pathways", "Cerebellum", "Limbic System & Ventricles", "Visual & Auditory Pathways"],
    "Obstetrics and Gynecology": ["Prenatal Care", "Labor & Delivery Stages", "Gestational Disorders", "Ovarian Cycle", "Uterine Diseases", "Menopause"],
    "Ophthalmology": ["Refractive Errors", "Cataract", "Glaucoma", "Retinal Diseases", "Uveitis", "Ocular Trauma"],
    "Pathology": ["Cellular Injury & Cell Death", "Acute & Chronic Inflammation", "Hemodynamic Disorders", "Neoplasia & Tumor Biology", "Systemic Pathology", "Immunopathology"],
    "Pediatrics": ["Neonatal Medicine", "Childhood Milestones", "Pediatric Infections", "Congenital Heart Anomalies", "Immunization Schedules", "Nutritional Disorders (PEM)"],
    "Petroleum Engineering": ["Reservoir Engineering", "Drilling Technology", "Production Engineering", "Well Logging", "Petrophysics", "Enhanced Oil Recovery"],
    "Pharmacology": ["Pharmacokinetics", "Pharmacodynamics", "Autonomic Nervous System Drugs", "Cardiovascular Pharmacology", "Antibiotics & Chemotherapies", "Neuropharmacology"],
    "Physical Education": ["Athletics", "Team Sports", "Health Education", "Physical Fitness", "First Aid", "Sports Administration"],
    "Physics": ["Mechanics", "Electromagnetism", "Thermodynamics", "Quantum Physics", "Wave Optics", "Atomic & Nuclear Physics"],
    "Physiology": ["Cardiovascular Physiology", "Respiratory Mechanics", "Renal & Acid-Base Physiology", "Neurophysiology", "Endocrine Physiology", "Gastrointestinal Physiology"],
    "Psychiatry": ["Psychosis", "Mood Disorders", "Anxiety Disorders", "Personality Disorders", "Child Psychiatry", "Psychopharmacology"],
    "Radiology": ["X-ray Principles", "CT Imaging", "MRI Physics", "Ultrasound Basics", "Nuclear Medicine", "Radiation Safety"],
    "Statistics": ["Probability Theory", "Inferential Statistics", "Regression Analysis", "Design of Experiments", "Non-Parametric Methods", "Time Series Analysis"],
    "Strength of Materials": ["Stress & Strain", "Torsion", "Bending Moments", "Deflection of Beams", "Column Buckling", "Thermal Stresses"],
    "Structural Engineering": ["Reinforced Concrete Design", "Steel Structure Design", "Finite Element Method", "Seismic Loadings", "Bridge Engineering", "Structural Dynamics"],
    "Surgery": ["General Surgery Principles", "Orthopedics", "Neurosurgery", "Trauma & Emergency", "Anesthesia Basics", "Wound Healing"],
    "Technical Drawing": ["Geometrical Construction", "Orthographic Projection", "Isometric Drawing", "Machine Drawing", "Architectural Drawing", "Autocad Drafting Core"],
    "Thermodynamics": ["First Law", "Second Law", "Entropy", "Power Cycles", "Refrigeration Systems", "Chemical Thermodynamics"],
    "Yoruba": ["Asa Yoruba", "Litireso Yoruba", "Ise Yoruba", "Girama Yoruba", "Aroko", "Ofin Ede Yoruba"],
    "Zoology": ["Invertebrate Biology", "Vertebrate Anatomy", "Animal Physiology", "Ethology", "Comparative Anatomy", "Parasitology Core"]
  };

  /**
   * Explictly retrieves the list of sub-topics for a given subject and difficulty level.
   * If not explicitly defined, it intelligently morphs default topics to fit the specified level.
   */
  public static getSubTopics(subject: string, level: string = "standard"): string[] {
    const list = this.defaultTopics[subject] || [
      "Foundational Principles",
      "Intermediate Applications",
      "Advanced Methodologies",
      "Theoretical Synthesis",
      "Critical Research Case Studies",
      "Practice Regulations & Ethics"
    ];

    // Align sub-topics explicitly to reflect level requirements for medical domains requested
    if (subject === "Anatomy: Extremities (Locomotor)") {
      if (level === "undergrad") {
        return [
          "Shoulder, Axilla & Brachial Plexus",
          "Compartments of the Upper Limb & Nerve Palsies",
          "Gluteal Region & Thigh (Femoral Triangle)",
          "Popliteal Fossa, Leg & Foot Joints",
          "Joint Mechanics & Stability (Knee/Shoulder)",
          "Anatomical Correlates of Common Fractures"
        ];
      }
      if (level === "advanced") {
        return [
          "Surgical Approaches to Extremity Joints",
          "Compartment Syndrome Dx & Fasciotomy Landmarks",
          "Peripheral Nerve Entrapments & Surgical Releases",
          "Orthopedic Fracture Classifications (Salter-Harris)",
          "Deep Tendon, Ligament & Microvascular Repair",
          "Limb Salvage and Osteomyelitis Debridement"
        ];
      }
      if (level === "postgrad") {
        return [
          "Biomechanical Modeling of Extremity Joints",
          "Cartilage and Ligament Tissue-Engineering",
          "Micro-Neurovascular Repair Regeneration Kinetics",
          "Neuromechanical Control of Locomotion",
          "Bone Morphogenetic Proteins in Skeletal Repair",
          "Advanced Comparative Hominid Locomotor Morphology"
        ];
      }
      if (level === "professional") {
        return [
          "Orthopaedic Fellowship Shoulder/Hip Exposures",
          "Surgical Management of Gustilo-Anderson fractures",
          "Reconstructive Extremity Flap Anatomy & Harvest",
          "Management of Complex Neuromuscular Deficits",
          "Arthroplasty Revision Anatomical Challenges",
          "Medico-legal Aspects of Extremity Trauma Surgery"
        ];
      }
    }

    if (subject === "Cardiovascular, Blood & Lymphatics (CBD)") {
      if (level === "undergrad") {
        return [
          "Cell Biology of Erythropoiesis & RBC Lifespan",
          "Hemoglobin Synthesis & Normal Blood Groups",
          "Intrinsic & Extrinsic Clotting Pathways",
          "Myocardial Contraction Mechanism & Action Potentials",
          "Wiggers Diagram of Cardiac Cycle & Output",
          "Microscopic Anatomy of Blood Vessels & Spleen"
        ];
      }
      if (level === "advanced") {
        return [
          "Pathophysiology of Congenital & Valvular Diseases",
          "Infective Endocarditis, Myocarditis & Cardiomyopathy",
          "Bleeding Disorders (Hemophilia, vWD, DIC, DVT)",
          "Leukemias, Lymphomas & Myelodysplastic Syndromes",
          "Therapeutic Anticoagulation & Antiplatelet Control",
          "Marrow Failure Syndromes & Immune Cytopenias"
        ];
      }
      if (level === "postgrad") {
        return [
          "Molecular Mechanisms in Leukemia Pathogenesis",
          "Endothelial Shear-stress Gene Regulation Models",
          "Cytokine Receptor Signaling in Hematopoiesis",
          "Pluripotent Hematopoietic Stem Cell Microenvironments",
          "Molecular Immunology of Transfusion Reactions",
          "Mechanisms of Myocardial Action Potential Remodeling"
        ];
      }
      if (level === "professional") {
        return [
          "NPMCN / Board ACS Diagnostics & Interventions",
          "Hematology Specialist Coagulopathy Algorithms",
          "Fellowship-level Bone Marrow Transplant Medicine",
          "Therapeutic Management of Unstable Angina/STEMI",
          "Valvular Heart Disease Valve Replacement Criteria",
          "Advanced Transfusion Medicine & Apheresis Protocols"
        ];
      }
    }

    if (subject === "Cardiovascular & Respiratory Systems (CV/RS)") {
      if (level === "undergrad") {
        return [
          "Gross Anatomy of Bronchopulmonary Segments",
          "Respiratory Mechanics & Alveolar Surfactant Function",
          "Spirometry (FEV1, FVC, Tidal & VC Parameters)",
          "Oxygen-Hemoglobin Dissociation Curves & Gas Transport",
          "Acid-Base Regulation & Renal-Respiratory Buffering",
          "Central & Peripheral Chemoreceptor Reflex Controls"
        ];
      }
      if (level === "advanced") {
        return [
          "Chronic Heart Failure Pathophysiology & Therapeutics",
          "Therapeutic Management of ACS & Hypertension",
          "Asthma Step-Up Care Regimens & COPD Protocols",
          "Restrictive Lung Diseases & Pulmonary Fibrosis",
          "Acute Respiratory Distress Syndrome (ARDS) Criteria",
          "Interpretative Ventilation-Perfusion (V/Q) Mismatch"
        ];
      }
      if (level === "postgrad") {
        return [
          "Vascular Remodeling in Pulmonic Hypertension",
          "Mitochondrial Respiration and Hypoxia-Inducible Factors",
          "Pulmonary Endothelial Shear-Stress Mechanics",
          "Molecular Biology of Surfactant Proteins in ARDS",
          "Computational Models of Cardiorespiratory Dynamics",
          "Neuro-Respiratory Pattern Generator Models"
        ];
      }
      if (level === "professional") {
        return [
          "Intensive Care Vent Setting Strategies (ARDS/COPD)",
          "Advanced Fellowship-level CHF Management Guilds",
          "Pulmonary Artery Catheter readings & Swan-Ganz Dx",
          "Aortic Dissection & Refractory Arrhythmia Decisions",
          "Management of Complex Mixed Acid-Base Disturbances",
          "Thoracic Anesthesia Single-Lung Ventilation Management"
        ];
      }
    }

    if (subject === "Infectious Diseases System (IDS)") {
      if (level === "undergrad") {
        return [
          "Bacterial Staining (Gram Positive vs Gram Negative)",
          "Innate vs Adaptive Immunity & Antigen Recognition",
          "Antibody Classes, Structure & Function",
          "T/B Cell Maturation Path & Complement Pathways",
          "Classic Staining & Morphology of Protozoa & Helminths",
          "Life Cycles of Key African Parasites (Malaria, Shisto)"
        ];
      }
      if (level === "advanced") {
        return [
          "Clinical Antimicrobial Pharmacology & Selection",
          "Therapeutic Algorithms for Multi-Drug Resistant TB",
          "Tropical Infection Syndromes (Lassa, Typhoid, Cholera)",
          "Opportunistic Systemic Infections in HIV & Meningitis",
          "Infectious Disease Surveillance & Outbreak Protocols",
          "Diagnostics: PCR, Serologies & Resistance Panels"
        ];
      }
      if (level === "postgrad") {
        return [
          "Molecular Biology of Bacterial Beta-Lactamases",
          "Viral Fusion Mechanisms & Host-Cell Penetration",
          "Immunological Cytokine Storm Models in Septic Shock",
          "Advanced Empirical Mathematical Disease Modeling",
          "Host Gene Regulation During Chronic Viral Infection",
          "Evolutionary Genomics of Antimicrobial Resistance"
        ];
      }
      if (level === "professional") {
        return [
          "Fellowship Specialist Antimicrobial Stewardship",
          "Salvage Regimens for Multi-Drug Resistant TB/HIV",
          "WACP Nosocomial Outbreak Investigation Protocols",
          "Critical Care Management of Severe Septic Shock",
          "Tropical Infection Board Specialists Decisions (Lassa)",
          "Advanced Medical Legal Regulations & Pandemics Rules"
        ];
      }
    }

    if (subject === "Anatomy") {
      if (level === "undergrad") {
        return [
          "General Torso, Abdominal & Thoracic Visceral Layouts",
          "Developmental Embryology & Germ Layer Derivatives",
          "Epithelium & Basic Structural Tissue Histology",
          "Spinal Cord Mechanics & Intro to Cranial Nerves",
          "Musculoskeletal Layout of Body Trunk & Joints",
          "Basic Cardiac Anatomy & Coronary Arterial Paths"
        ];
      }
      if (level === "advanced") {
        return [
          "Clinical Neuroanatomy: Cranial Nerve Pathologies",
          "Microscopic Architecture of Endocrine & Solid Organs",
          "Anatomical Surgical Landmarks of Torso & Neck",
          "Anatomy of Complex Abdominal Retroperitoneal Spaces",
          "Clinical Embryology: Congenital Malformations",
          "Pathological Vascular Occlusions & Collateral Flows"
        ];
      }
    }

    // Dynamic morphing approach if not explicitly mapped
    return list.map(topic => {
      if (level === "undergrad") {
        return `Pre-Clinical/Foundational aspects of ${topic}`;
      } else if (level === "advanced") {
        return `Advanced clinical/conceptual analysis of ${topic}`;
      } else if (level === "postgrad") {
        return `Molecular, theoretical & research dimensions of ${topic}`;
      } else if (level === "professional") {
        return `Professional practice & specialist decision constraints in ${topic}`;
      }
      return topic;
    });
  }

  /**
   * Retrieves the detailed curriculum metadata (Scope & Expected Difficulty Rating) 
   * for any subject and level.
   */
  public static getCurriculumMetadata(subject: string, level: string = "standard"): { scope: string; difficultyRating: string } {
    let scope = "";
    let difficultyRating = "";

    if (level === "undergrad") {
      difficultyRating = "100 - 300 Level (Undergraduate Academic Curriculum)";
      scope = `Aligns strictly with intermediate undergraduate outlines of top Nigerian Universities (e.g. UNILORIN, UNILAG, UI). For Medical/Basic sciences (Anatomy, Physiology, Biochemistry, CBD, CV/RS, IDS), the material focuses at least 95% on pre-clinical basic physiological mechanics and cell biology, restricting case scenarios to minor pre-clinical correlates (<5%). No advanced management or surgical protocols.`;
    } else if (level === "advanced") {
      difficultyRating = "400 - 600 Level (Advanced / Clinical Undergraduate)";
      scope = `Matches the rigorous advanced degree and clinical course curriculum of premier Nigerian Medical Schools, Teaching Hospitals, and advanced Engineering faculties (e.g., UCH Ibadan, LUTH, UITH). Integrates advanced pathophysiology, design theories, diagnostic interpretations (such as imaging/biomarkers), and complex calculations. Case vignettes are restricted to exactly 20-30% of content, emphasizing deeper mechanics throughout.`;
    } else if (level === "postgrad") {
      difficultyRating = "Postgraduate (Master's and PhD Coursework and Research)";
      scope = `Represents graduate school requirements. Demands critical evaluation, advanced experimental/research methodology design, advanced molecular/cellular systems, biostatistics modeling, comparative literature analysis, and highly abstract theoretical synthesis.`;
    } else if (level === "professional") {
      difficultyRating = "Fellowship / Professional Board Certification (e.g., NPMCN, WACS, WACP, ICAN, COREN, Bar Exams)";
      scope = `Focuses heavily on high-stakes specialist decision-making, expert regulatory guidelines, advanced differential diagnostics, expert-level clinical pharmacology, therapeutic algorithms, project ethics, environmental laws, and standard code standards. Vignettes constitute 40-50% with the remainder focusing on advanced specialist theory.`;
    } else {
      difficultyRating = "Senior Secondary Level (WAEC / JAMB UTME / NECO)";
      scope = `Strictly mirrors the national secondary school syallbi and guidelines (WAEC/JAMB/NECO). Focuses on standard high school textbook facts, basic algebra, general science, and fundamental vocabulary. Completely avoids advanced university or clinical contexts.`;
    }

    // Customize the scope slightly based on subject groupings for absolute precision
    if (subject === "Anatomy: Extremities (Locomotor)") {
      scope += " Focuses on upper and lower limb musculoskeletal mechanics, joints, plexuses, and nerve lesions.";
    } else if (subject === "Cardiovascular, Blood & Lymphatics (CBD)") {
      scope += " Focuses on hematopoiesis, normal clotting pathways, myocardial action potential, cardiac output regulation, and spleen architecture.";
    } else if (subject === "Cardiovascular & Respiratory Systems (CV/RS)") {
      scope += " Focuses on ventilation mechanics, spirometry, oxygen transport, cardiorespiratory neuro-reflex controls, and blood buffer kinetics.";
    } else if (subject === "Infectious Diseases System (IDS)") {
      scope += " Focuses on Gram cell wall biology, immune cell maturation, parasites, antiviral/antimicrobial kinetics, stewardship, and resistance patterns.";
    }

    return { scope, difficultyRating };
  }
}
