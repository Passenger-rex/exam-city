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
  public static defaultTopics: Record<string, string[]> = {
    "Anatomy": ["Gross Anatomy", "Histology Core", "Embryology Base", "Neuroanatomy Intro", "Musculoskeletal System", "Cardiovascular Anatomy", "Cardiovascular & Blood Physiology", "Respiratory & Renal Anatomy", "Lymphatic System", "Central Nervous System"],
    "Anatomy: Extremities (Locomotor)": ["Pectoral Girdle & Axilla", "Brachial Plexus & Arm Anatomy", "Forearm & Hand compartments", "Gluteal Region & Thigh", "Popliteal Fossa & Leg", "Ankle, Foot & Joint Mechanics"],
    "Basic Science": ["Living & Non-Living Things", "Matter & Energy", "The Human Body", "Environment", "Reproductive Health", "Forces & Motion"],
    "Basic Technology": ["General Woodwork", "Metalwork", "Energy & Power", "Building Technology", "Technical Drawing Intro", "Electrical Wiring Basics"],
    "Biochemistry": ["Metabolism", "Enzymology", "Cell Signaling", "Molecular Biology Techniques", "Structure of Biomolecules", "Bioenergetics"],
    "Biology": ["Cell Biology", "Genetics", "Ecology", "Evolutionary Biology", "Plant Physiology", "Systematics & Taxonomy"],
    "Biotechnology": ["Genomics", "Proteomics", "Bioinformatics", "Environmental Biotech", "Plant Biotechnology", "Recombinant DNA Tools"],
    "Botany": ["Plant Anatomy", "Photosynthesis", "Plant Reproduction", "Systematics", "Plant Ecology", "Plant Biochemistry"],
    "Business Studies": ["Office Practice", "Commerce Principles", "Bookkeeping", "Keyboarding", "Entrepreneurship", "Business Ethics"],
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
    "Insurance": ["Principles of Insurance", "Life & Health Insurance", "Marine & Aviation Insurance", "Motor & Property Insurance", "Reinsurance Basics", "Risk Management Principles"],
    "Internal Medicine": ["Cardiology", "Pulmonology", "Gastroenterology", "Endocrinology", "Rheumatology", "Infectious Diseases", "Nephrology", "Neurology"],
    "IRK": ["Fundamentals of Islam", "Hadith", "Sharia Law", "History of Islam", "Islamic Ethics", "Quranic Text Studies"],
    "Mathematics": ["Algebra", "Euclidean Geometry", "Trigonometry", "Statistics & Probability", "Calculus Principles", "Indices and Logarithms"],
    "Mechanical Engineering": ["Machine Design", "Thermodynamics", "Manufacturing Processes", "Control Systems", "Mechatronics", "Strength of Materials"],
    "Medical Biochemistry": ["Enzymology", "Glycolysis & Krebs Cycle", "Lipid Metabolism", "Protein Synthesis & Translation", "DNA Replication", "Hormonal Biochemistry"],
    "Medical Histology": ["Epithelial Tissue", "Connective Tissue", "Muscle Tissue", "Nervous Tissue", "Respiratory Histology", "Organ Histology"],
    "Medical Microbiology": ["Bacteriology", "Virology", "Mycology", "Diagnostic Techniques", "Antibiotic Resistance", "Parasitology Basics"],
    "Medical Parasitology": ["Plasmodium & Malaria", "Schistosoma & Bilharziasis", "Soil-Transmitted Helminths", "Protozoan Infections (Amoeba, Giardia)", "Arthropod Vectors of Disease", "Laboratory Diagnostics of Parasites"],
    "Medicine": ["General Pathological Principles", "Respiratory Diseases", "Cardiovascular Diagnostics", "Renal System Pathologies", "Endocrine Disorders", "CNS Infections & Diagnosis", "Blood & Lymphatic System", "Systemic Pathology", "Tropical Medicine"],
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
    "Physiology": ["Cardiovascular Physiology", "Respiratory Mechanics", "Renal & Acid-Base Physiology", "Neurophysiology", "Endocrine Physiology", "Gastrointestinal Physiology", "Hematology & Blood Physiology"],
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

    const SECONDARY_SUBJECTS = [
      "Accounting", "Agricultural Science", "Basic Science", "Basic Technology", "Biology", "Chemistry", 
      "Civic Education", "Commerce", "CRK", "Economics", "English", "English Literature", "Fine Art", 
      "French", "Further Mathematics", "Geography", "Hausa", "History", "Home Economics", "Igbo", 
      "IRK", "Mathematics", "Physical Education", "Physics", "Technical Drawing", "Yoruba", "Business Studies", "Current Affairs"
    ];

    if (SECONDARY_SUBJECTS.includes(subject)) {
      return list; // Do NOT morph secondary school topics with preclinical, clinical or research terms!
    }

    // Map custom sub-levels/years of study to the base standard levels for topic structures
    let baseLevel = "standard";
    if (["200", "300", "200_eng", "300_eng", "100_sci", "200_sci", "300_sci", "undergrad"].includes(level)) {
      baseLevel = "undergrad";
    } else if (["400", "500", "600", "400_eng", "500_eng", "400_sci", "advanced"].includes(level)) {
      baseLevel = "advanced";
    } else if (level === "postgrad") {
      baseLevel = "postgrad";
    } else if (level === "professional") {
      baseLevel = "professional";
    }

    // Align sub-topics explicitly to reflect level requirements for medical domains requested
    if (subject === "Anatomy: Extremities (Locomotor)") {
      if (baseLevel === "undergrad") {
        return [
          "Shoulder, Axilla & Brachial Plexus",
          "Compartments of the Upper Limb & Nerve Palsies",
          "Gluteal Region & Thigh (Femoral Triangle)",
          "Popliteal Fossa, Leg & Foot Joints",
          "Joint Mechanics & Stability (Knee/Shoulder)",
          "Anatomical Correlates of Common Fractures"
        ];
      }
      if (baseLevel === "advanced") {
        return [
          "Surgical Approaches to Extremity Joints",
          "Compartment Syndrome Dx & Fasciotomy Landmarks",
          "Peripheral Nerve Entrapments & Surgical Releases",
          "Orthopedic Fracture Classifications (Salter-Harris)",
          "Deep Tendon, Ligament & Microvascular Repair",
          "Limb Salvage and Osteomyelitis Debridement"
        ];
      }
      if (baseLevel === "postgrad") {
        return [
          "Biomechanical Modeling of Extremity Joints",
          "Cartilage and Ligament Tissue-Engineering",
          "Micro-Neurovascular Repair Regeneration Kinetics",
          "Neuromechanical Control of Locomotion",
          "Bone Morphogenetic Proteins in Skeletal Repair",
          "Advanced Comparative Hominid Locomotor Morphology"
        ];
      }
      if (baseLevel === "professional") {
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

    if (subject === "Physiology") {
      if (level === "200" || level === "200_sci") {
        return [
          "Cell Membrane Potential & Transport Mechanisms",
          "General Blood Physiology & Hematopoiesis",
          "Hemostasis, Clotting Cascade & Platelet Function",
          "Nerve-Muscle Physiology & Synaptic Transmission",
          "Cardiac Cycle, Output & Regulation",
          "Electrophysiology & Electrocardiography (ECG) Mechanics"
        ];
      }
      if (level === "300" || level === "300_sci" || baseLevel === "undergrad") {
        return [
          "Pulmonary Ventilation, Spirometry & Surfactant Mechanics",
          "Alveolar Gas Exchange & Oxygen Dissociation Dynamics",
          "Renal Glomerular Filtration & Tubular Secretion/Reabsorption",
          "Renal Acid-Base Balancing & Buffering Systems",
          "Central Nervous System Motor Pathways & Sensory Control",
          "Endocrine Hormonal Feedback Mechanics & Metabolism"
        ];
      }
      if (level === "400" || level === "400_sci" || baseLevel === "advanced") {
        return [
          "Pathophysiology of Anemic Syndromes & Transfusion Reactions",
          "Thrombotic Disorders & Hemorrhagic Diathesis Cascade",
          "Cardiorespiratory Failures, Valvular Disease & Shock States",
          "Chronic Renal Failure & Electrolyte Disturbances",
          "Endocrinological Pathologies & Metabolic Derangements",
          "Neuropathophysiology & Autonomic Dysfunction Clinical Tests"
        ];
      }
      if (baseLevel === "postgrad") {
        return [
          "Molecular Signal Transduction & Receptor Biophysics",
          "Patch-Clamp Electrophysiology of Ion Channels",
          "Vascular Endothelial Shear-Stress Regulator Biology",
          "Biophysical Modeling of Renal Tubular Transport",
          "Adipokines & Hypothalamic Axis Feedbacks",
          "Respiratory Center Control & Hypoxia-Inducible Kinetics"
        ];
      }
      if (baseLevel === "professional") {
        return [
          "Fellowship Clinical Acid-Base Correction Protocols",
          "Board-Certified Cardiac Rhythm Management & ECG Diagnostics",
          "Critical Care Pulmonary Function & Ventilatory Settings",
          "Endocrine Emergencies & Diabetic Ketoacidosis Protocols",
          "Advanced Cardiovascular Dynamics under Vasoactive Support",
          "Renal Replacement Therapy & Nephrological Management"
        ];
      }
    }

    if (subject === "Medical Biochemistry") {
      if (level === "200" || level === "200_sci") {
        return [
          "Structure & Classification of Carbohydrates & Proteins",
          "Lipids Classification, Fatty Acids & Membrane Structure",
          "Enzyme Kinetics, Michaelis-Menten & Inhibition Types",
          "Glycolysis, Krebs Cycle & Electron Transport Chain",
          "Glycogen Metabolism & Gluconeogenesis Pathways",
          "Urea Cycle & Amino Acid Catabolism"
        ];
      }
      if (level === "300" || level === "300_sci" || baseLevel === "undergrad") {
        return [
          "Beta-Oxidation of Fatty Acids & Ketogenesis",
          "De Novo Purine & Pyrimidine Nucleotide Synthesis",
          "DNA Replication, DNA Repair & Mutation Mechanisms",
          "Transcription, RNA Processing & Spliceosome Control",
          "Translation, Ribosomes & Post-translational Modifications",
          "Hormonal Signal Transduction, GPCR & Tyrosine Kinase Axes"
        ];
      }
      if (level === "400" || level === "400_sci" || baseLevel === "advanced") {
        return [
          "Pathological Biochemistry of Diabetes Mellitus & Ketoacidosis",
          "Inborn Errors of Metabolism (G6PD Deficiency, PKU)",
          "Dyslipidemias & Atherosclerosis Biochemical Cascades",
          "Liver Function Tests & Serum Bilirubin Interpretation",
          "Tumor Markers & Molecular Biochemistry of Oncogenes",
          "Porphyria Biochemistry & Hemoglobin Degradation Pathways"
        ];
      }
      if (baseLevel === "postgrad") {
        return [
          "Recombinant DNA Tools & Molecular Gene Cloning",
          "Epigenetics, Histone Modifications & DNA Methylation",
          "Proteomics & Mass Spectrometry Structural Analysis",
          "Metabolic Flux Analysis & Computer Modeling",
          "Molecular Targets in Chemotherapeutic Selection",
          "CRISPR-Cas9 Gene Editing Mechanics & Bioengineering"
        ];
      }
      if (baseLevel === "professional") {
        return [
          "Clinical Laboratory Quality Management & Westgard Rules",
          "Molecular Diagnostics of Hereditary Genetic Disorders",
          "Inborn Metabolic Emergency Screening Protocols",
          "Therapeutic Drug Monitoring & Toxicology Assays",
          "Advanced Biomarkers in Acute Coronary Syndrome",
          "Endocrine Assay Interpretations & Lab Standardization"
        ];
      }
    }

    if (subject === "Anatomy") {
      if (level === "200" || level === "200_sci") {
        return [
          "General Torso, Abdominal & Thoracic Visceral Layouts",
          "Developmental Embryology & Germ Layer Derivatives",
          "Epithelium & Basic Structural Tissue Histology",
          "Musculoskeletal Spine & General Vertebrae",
          "Anatomical terminology & planes of dissection",
          "Skin structure & Integumentary layers"
        ];
      }
      if (level === "300" || level === "300_sci" || baseLevel === "undergrad") {
        return [
          "Detailed Cranial Nerve courses & Exit foramina",
          "Microscopic histology of main visceral organs",
          "Structural anatomy of the Gastrointestinal tract & Mesentery",
          "Genitourinary anatomy, Kidney sections & Pelvic floor",
          "Peritoneum, retroperitoneal structures & Spaces",
          "Brachial plexus & Locomotor musculoskeletal details"
        ];
      }
      if (level === "400" || level === "400_sci" || baseLevel === "advanced") {
        return [
          "Surgical landmarks of the neck, thorax & abdomen",
          "Pathological vascular occlusions & collateral circulatory paths",
          "Congenital anomalies (Patent ductus, Spina bifida, Cleft palate)",
          "Anatomical variations of major blood vessels & nerves",
          "Cross-sectional anatomy & radiographic correlation (CT/MRI)",
          "Oncological lymphatic drainage pathways for surgical staging"
        ];
      }
    }

    // Dynamic morphing approach if not explicitly mapped
    return list.map(topic => {
      if (baseLevel === "undergrad") {
        return `Foundational/Undergrad aspects of ${topic}`;
      } else if (baseLevel === "advanced") {
        return `Advanced/Applied aspects of ${topic}`;
      } else if (baseLevel === "postgrad") {
        return `Molecular, theoretical & research dimensions of ${topic}`;
      } else if (baseLevel === "professional") {
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

    // Years of Study Medical / Clinical mapping
    if (level === "200") {
      difficultyRating = "200 Level (Pre-Clinical Year 1)";
      scope = `Covers 200 level foundational preclinical medical curriculum in Gross Anatomy, systemic Physiology, Medical Biochemistry, & Histology. Restricts clinical vignettes to minor pre-clinical references (<2%).`;
    } else if (level === "300") {
      difficultyRating = "300 Level (Pre-Clinical Year 2)";
      scope = `Aligns with the 300 level preclinical medical syllabus prior to major clinical transition. Emphasizes advanced electrophysiology, cardiorespiratory ventilation, neuroanatomy, and basic immunology paths.`;
    } else if (level === "400") {
      difficultyRating = "400 Level (Clinical Year 1 / Laboratory Medicine)";
      scope = `Studies Clinical Year 1 curriculum, focusing intensely on Pathological sciences, Histopathology, Clinical Pharmacology, Medical Microbiology, and Parasitology. Vignettes are limited to at most 10-15%.`;
    } else if (level === "500") {
      difficultyRating = "500 Level (Clinical Year 2 / Specialities)";
      scope = `Corresponds to 500 level syllabus focusing key areas: Pediatrics, Obstetrics and Gynecology, and Community Medicine. Direct clinical vignettes represent less than 15% of questions.`;
    } else if (level === "600") {
      difficultyRating = "600 Level (Clinical Year 3 / Senior Clerkships)";
      scope = `Aligns with final year (600 Level) medical board expectations in Internal Medicine, General Surgery, Psychiatry, Ophthalmology, ENT, and Radiographic diagnostics.`;
    }
    // Engineering 5-year B.Eng mapping
    else if (level === "200_eng") {
      difficultyRating = "200 Level (Basics of Engineering)";
      scope = `Covers 200 level foundational engineering topics: general mathematics, statistics, basic fluid mechanics, basic mechanics of materials, and engineering thermodynamics.`;
    } else if (level === "300_eng") {
      difficultyRating = "300 Level (Intermediate B.Eng Specialization)";
      scope = `Reviews intermediate 300 level courses: design elements, advanced circuit analysis, structural analysis, and core mechanical/civil/chemical system theories.`;
    } else if (level === "400_eng") {
      difficultyRating = "400 Level (Advanced Systems & IT Preparation)";
      scope = `Matches 400 level engineering coursework: advanced control systems, software systems design, transport phenomena, and systems optimization.`;
    } else if (level === "500_eng") {
      difficultyRating = "500 Level (Senior Professional Design & Projects)";
      scope = `Evaluates final-year 500 level engineering standards, including design code enforcement, professional systems optimization, and core electives.`;
    }
    // Science B.Sc mapping
    else if (level === "100_sci") {
      difficultyRating = "100 Level (General Science)";
      scope = `Encompasses introductory 100 level general science subjects (entry university-level cell structure, chemistry stoichiometry, base mechanics).`;
    } else if (level === "200_sci") {
      difficultyRating = "200 Level (Foundational B.Sc Subject Core)";
      scope = `Dives into 200 level science fundamentals: basic organic nomenclature, basic microbiology morphology, and structural genetics.`;
    } else if (level === "300_sci") {
      difficultyRating = "300 Level (Intermediate Theory & Laboratory)";
      scope = `Represents 300 level science: intermediate metabolic reactions, chemical control processes, and analytical scientific techniques.`;
    } else if (level === "400_sci") {
      difficultyRating = "400 Level (Advanced Seminar & Scientific Research)";
      scope = `Targets 400 level final year B.Sc requirements: contemporary molecular research models, abstract systems biology, and advanced thesis theories.`;
    }
    // Backward-compatible/fallback mapping
    else if (level === "undergrad") {
      difficultyRating = "100 - 300 Level (Undergraduate Academic Curriculum)";
      scope = `Aligns strictly with intermediate undergraduate outlines of top Nigerian Universities (e.g. UNILORIN, UNILAG, UI). For Medical/Basic sciences (Anatomy, Physiology, Biochemistry), the material focuses at least 95% on pre-clinical basic physiological mechanics and cell biology, restricting case scenarios to minor pre-clinical correlates (<5%). No advanced management or surgical protocols.`;
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
    }

    return { scope, difficultyRating };
  }

  /**
   * Returns all defined subject names in the curriculum configuration
   */
  public static getAllSubjects(): string[] {
    return Object.keys(this.defaultTopics);
  }

  /**
   * Generates a level-to-topics map for all supported difficulty levels of a subject
   */
  public static getAllTopicsByLevel(subject: string): Record<string, string[]> {
    const levels = [
       "standard", "undergrad", "advanced", "postgrad", "professional",
       "100_sci", "200_sci", "300_sci", "400_sci",
       "200_eng", "300_eng", "400_eng", "500_eng",
       "200", "300", "400", "500", "600"
    ];
    const map: Record<string, string[]> = {};
    for (const lvl of levels) {
       map[lvl] = this.getSubTopics(subject, lvl);
    }
    return map;
  }

  /**
   * Returns a default category group for a given subject to improve predictive classification
   */
  public static getDefaultGroup(subject: string): string {
    const sub = String(subject).toLowerCase().trim();
    
    // Medical keywords
    if (
      sub.includes("anatomy") || sub.includes("biochem") || sub.includes("immunology") || 
      sub.includes("medicine") || sub.includes("dermatology") || sub.includes("embryology") || 
      sub.includes("ent") || sub.includes("hematology") || sub.includes("histology") || 
      sub.includes("microbiology") || sub.includes("parasitology") || sub.includes("obstetrics") || 
      sub.includes("ophthalmology") || sub.includes("pathology") || sub.includes("pediatrics") || 
      sub.includes("pharmacology") || sub.includes("physiology") || sub.includes("psychiatry") || 
      sub.includes("radiology") || sub.includes("surgery") || sub.includes("biology") || 
      sub.includes("botany") || sub.includes("zoology") || sub.includes("genetics") || 
      sub.includes("molecular biology") || sub.includes("biotechnology") || sub.includes("food science")
    ) {
      return "Medical";
    }

    // Engineering keywords
    if (
      sub.includes("engineering") || sub.includes("fluid mechanics") || 
      sub.includes("strength of materials") || sub.includes("thermodynamics") || 
      sub.includes("technology") || sub.includes("technical drawing")
    ) {
      return "Engineering";
    }

    // Humanities keywords
    if (
      sub.includes("english") || sub.includes("literature") || sub.includes("french") || 
      sub.includes("art") || sub.includes("hausa") || sub.includes("igbo") || 
      sub.includes("yoruba") || sub.includes("history") || sub.includes("civic") || 
      sub.includes("crk") || sub.includes("irk") || sub.includes("current affairs")
    ) {
      return "Humanities";
    }

    // Science keywords
    if (
      sub.includes("science") || sub.includes("chemistry") || sub.includes("physics") || 
      sub.includes("mathematics") || sub.includes("geography") || sub.includes("geology") || 
      sub.includes("geophysics") || sub.includes("meteorology") || sub.includes("statistics")
    ) {
      return "Science";
    }

    // Social Science
    if (
      sub.includes("business") || sub.includes("economics") || 
      sub.includes("commerce") || sub.includes("insurance")
    ) {
      return "Social Sciences";
    }

    return "General";
  }
}
