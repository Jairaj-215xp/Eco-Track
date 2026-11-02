import os
import json
import math
import numpy as np
import cv2

METADATA_PATH = os.path.join("public", "dataset", "dataset_metadata.json")
BEFORE_DIR = os.path.join("public", "dataset", "before_cleanup")
AFTER_DIR = os.path.join("public", "dataset", "after_cleanup")
MODEL_OUTPUT_PATH = os.path.join("src", "services", "wasteModelWeights.json")

CATEGORIES = ["plastic", "household", "organic", "construction", "near_water"]

def extract_features(img_bgr, polygons=None):
    """
    Extracts multi-spectral color, texture, and morphological features
    from an image or specific polygon regions.
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    total_pixels = img_bgr.shape[0] * img_bgr.shape[1]

    # 1. Color feature ratios
    # Saturated plastics (Hue in orange/yellow/red/blue with Sat > 90)
    sat_mask = (hsv[:, :, 1] > 90) & (hsv[:, :, 2] > 70)
    plastic_ratio = float(np.sum(sat_mask) / total_pixels)

    # Specular white / translucent polythene highlights (Low Sat, High Val)
    polythene_mask = (hsv[:, :, 1] < 45) & (hsv[:, :, 2] > 200)
    polythene_ratio = float(np.sum(polythene_mask) / total_pixels)

    # Black polybags (Very low Val)
    black_bag_mask = (hsv[:, :, 2] < 45)
    black_bag_ratio = float(np.sum(black_bag_mask) / total_pixels)

    # Cardboard / Kraft paper (Hue: 10-25, Sat: 40-160, Val: 90-210)
    cardboard_mask = (hsv[:, :, 0] >= 10) & (hsv[:, :, 0] <= 25) & (hsv[:, :, 1] >= 40) & (hsv[:, :, 1] <= 160) & (hsv[:, :, 2] >= 90)
    cardboard_ratio = float(np.sum(cardboard_mask) / total_pixels)

    # Organic vegetative greens (Hue: 35-85, Sat: 50-255, Val: 40-200)
    organic_green_mask = (hsv[:, :, 0] >= 35) & (hsv[:, :, 0] <= 85) & (hsv[:, :, 1] >= 50) & (hsv[:, :, 2] >= 40)
    organic_green_ratio = float(np.sum(organic_green_mask) / total_pixels)

    # Terracotta brick red (Hue: 0-10 or 170-180, Sat: 80-220, Val: 80-210)
    brick_mask = ((hsv[:, :, 0] <= 10) | (hsv[:, :, 0] >= 170)) & (hsv[:, :, 1] >= 80) & (hsv[:, :, 2] >= 70)
    brick_ratio = float(np.sum(brick_mask) / total_pixels)

    # Aquatic water blue (Hue: 95-130, Sat: 60-240, Val: 50-220)
    water_mask = (hsv[:, :, 0] >= 95) & (hsv[:, :, 0] <= 130) & (hsv[:, :, 1] >= 60)
    water_ratio = float(np.sum(water_mask) / total_pixels)

    # 2. Texture & Edge energy
    edges = cv2.Canny(gray, 35, 110)
    edge_density = float(np.sum(edges > 0) / total_pixels)

    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    laplacian_var = float(laplacian.var())

    # 3. Morphological contour stats
    circularity_list = []
    solidity_list = []
    if polygons:
        for poly in polygons:
            cnt = np.array(poly, dtype=np.int32)
            area = cv2.contourArea(cnt)
            perimeter = cv2.arcLength(cnt, True)
            if perimeter > 0:
                circ = (4 * math.pi * area) / (perimeter * perimeter)
                circularity_list.append(circ)
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            if hull_area > 0:
                solidity_list.append(area / hull_area)

    mean_circularity = float(np.mean(circularity_list)) if circularity_list else 0.5
    mean_solidity = float(np.mean(solidity_list)) if solidity_list else 0.75

    return {
        "plastic_ratio": plastic_ratio,
        "polythene_ratio": polythene_ratio,
        "black_bag_ratio": black_bag_ratio,
        "cardboard_ratio": cardboard_ratio,
        "organic_green_ratio": organic_green_ratio,
        "brick_ratio": brick_ratio,
        "water_ratio": water_ratio,
        "edge_density": edge_density,
        "laplacian_var": laplacian_var,
        "mean_circularity": mean_circularity,
        "mean_solidity": mean_solidity
    }

def main():
    print("Loading dataset metadata from", METADATA_PATH)
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    print(f"Loaded {len(metadata)} scenes. Extracting visual & structural features...")

    category_samples = {c: [] for c in CATEGORIES}
    cleanliness_samples = []
    location_correlations = []
    reduction_samples = []

    for item in metadata:
        scene_id = item["sceneId"]
        waste_type = item["wasteType"]
        before_file = os.path.join("public", item["beforeImagePath"].lstrip("/"))
        after_file = os.path.join("public", item["afterImagePath"].lstrip("/"))

        before_bgr = cv2.imread(before_file)
        after_bgr = cv2.imread(after_file)

        if before_bgr is None or after_bgr is None:
            continue

        # Extract features
        polys = item.get("polygons", [])
        before_feats = extract_features(before_bgr, polys)
        after_feats = extract_features(after_bgr, None)

        if waste_type in category_samples:
            category_samples[waste_type].append(before_feats)

        # Cleanliness regression samples
        cleanliness_samples.append({
            "coverage": item["coveragePercent"],
            "edge_density": before_feats["edge_density"],
            "clusters": item["clustersCount"],
            "target_score": item["beforeCleanlinessScore"]
        })
        cleanliness_samples.append({
            "coverage": 0.0,
            "edge_density": after_feats["edge_density"],
            "clusters": 0,
            "target_score": item["afterCleanlinessScore"]
        })

        # Location histogram correlation (Before vs After)
        hist_before = cv2.calcHist([before_bgr], [0, 1], None, [16, 16], [0, 256, 0, 256])
        hist_after = cv2.calcHist([after_bgr], [0, 1], None, [16, 16], [0, 256, 0, 256])
        cv2.normalize(hist_before, hist_before, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_after, hist_after, 0, 1, cv2.NORM_MINMAX)
        correl = float(cv2.compareHist(hist_before, hist_after, cv2.HISTCMP_CORREL))
        location_correlations.append(correl)

        # Debris area reduction
        debris_reduction = (item["coveragePercent"] - 0) / max(1, item["coveragePercent"]) * 100
        reduction_samples.append(debris_reduction)

    print(f"Extracted features across {len(cleanliness_samples)} training samples.")

    # 1. Compute Category Centroids & Feature Thresholds
    category_weights = {}
    for cat, samples in category_samples.items():
        if not samples:
            continue
        avg_feats = {}
        for k in samples[0].keys():
            avg_feats[k] = round(float(np.mean([s[k] for s in samples])), 4)
        category_weights[cat] = avg_feats

    # 2. Calibrated Cleanliness Regression Weights
    # target = w0 + w_cov * coverage + w_edge * edge_density
    # We solve least squares [coverage, edge_density, 1] * w = target
    X = []
    Y = []
    for s in cleanliness_samples:
        X.append([s["coverage"], s["edge_density"] * 100, s["clusters"], 1.0])
        Y.append(s["target_score"])

    X_mat = np.array(X, dtype=np.float64)
    Y_mat = np.array(Y, dtype=np.float64)
    weights, residuals, rank, s = np.linalg.lstsq(X_mat, Y_mat, rcond=None)

    cleanliness_model = {
        "w_coverage": round(float(weights[0]), 4),
        "w_edge_density": round(float(weights[1]), 4),
        "w_clusters": round(float(weights[2]), 4),
        "intercept": round(float(weights[3]), 4)
    }

    # 3. Item Signature Recognition Profiles
    item_profiles = {
        "Polythene carry bags & pouches": {
            "triggers": ["polythene_ratio > 0.04", "plastic_ratio > 0.03"],
            "priority": 1,
            "category": "plastic"
        },
        "Crinkled food & snack wrappers": {
            "triggers": ["plastic_ratio > 0.05", "edge_density > 0.04"],
            "priority": 1,
            "category": "plastic"
        },
        "Discarded PET plastic bottles & caps": {
            "triggers": ["polythene_ratio > 0.02", "mean_circularity > 0.4"],
            "priority": 2,
            "category": "plastic"
        },
        "Cardboard delivery cartons & boxes": {
            "triggers": ["cardboard_ratio > 0.04"],
            "priority": 1,
            "category": "household"
        },
        "Food takeaway packaging & containers": {
            "triggers": ["cardboard_ratio > 0.02", "plastic_ratio > 0.02"],
            "priority": 2,
            "category": "household"
        },
        "Aluminum drink cans": {
            "triggers": ["edge_density > 0.05", "mean_circularity > 0.55"],
            "priority": 3,
            "category": "household"
        },
        "Vegetable peels & rotting food scraps": {
            "triggers": ["organic_green_ratio > 0.05"],
            "priority": 1,
            "category": "organic"
        },
        "Decaying garden leaf litter & twigs": {
            "triggers": ["organic_green_ratio > 0.08"],
            "priority": 2,
            "category": "organic"
        },
        "Broken terracotta bricks & masonry chunks": {
            "triggers": ["brick_ratio > 0.05"],
            "priority": 1,
            "category": "construction"
        },
        "Cracked concrete tiles & plaster rubble": {
            "triggers": ["brick_ratio > 0.03", "laplacian_var > 400"],
            "priority": 2,
            "category": "construction"
        },
        "Watercourse plastic obstruction": {
            "triggers": ["water_ratio > 0.15", "plastic_ratio > 0.03"],
            "priority": 1,
            "category": "near_water"
        }
    }

    # 4. Location Invariance Calibration
    avg_correl = float(np.mean(location_correlations))
    min_correl = float(np.min(location_correlations))
    correl_threshold = round(max(0.48, min_correl - 0.08), 2)

    # 5. Model Packaging
    trained_model = {
        "version": "2.4.0-eco-vision",
        "trainedOn": f"{len(metadata)} paired before & after scenes ({len(metadata)} before, {len(metadata)} after - {len(metadata)*2} samples total)",
        "categories": CATEGORIES,
        "categoryWeights": category_weights,
        "cleanlinessModel": cleanliness_model,
        "itemProfiles": item_profiles,
        "verificationCalibration": {
            "avgCorrelation": round(avg_correl, 3),
            "correlationThreshold": correl_threshold,
            "highReductionThreshold": 75,
            "partialReductionThreshold": 45
        },
        "contourSegmentation": {
            "minContourArea": 35,
            "cannyLow": 30,
            "cannyHigh": 105,
            "morphKernelSize": 7,
            "polygonSmoothEpsilon": 0.02, # smooth organic polygon contour fitting
            "highlightFillOpacity": 0.28,  # brand green semi-transparent polygon glow
            "highlightStrokeWidth": 2.5
        },
        "aiRecommendations": {
            "plastic": {
                "high": "Urgent dry-waste clearance required. Dispatch municipal recyclables collection truck, equip crew with puncture-resistant safety gloves, and route segregated plastics to authorized recycling center.",
                "medium": "Segregate dry plastics from organic waste. Schedule municipal van pickup and inspect adjacent storm drains for plastic bag blockage.",
                "low": "Community bin collection and routine dry-waste segregation recommended."
            },
            "household": {
                "high": "Intensive domestic waste accumulation. Deploy municipal compactor truck, sanitize perimeter with lime powder, and place covered community bins.",
                "medium": "Standard door-to-door waste vehicle dispatch. Clear cardboard packaging and sanitize surrounding sidewalk.",
                "low": "Provide community recycling hamper and monitor for illegal dumping."
            },
            "organic": {
                "high": "Bio-degradable wet waste pile. Divert immediately within 24h to decentralized municipal composting unit; spray microbial odor neutralizer to curb flies.",
                "medium": "Collect and divert to park composting pit. Sanitize moist pavement.",
                "low": "Garden leaf compost pile; sweep into botanical mulch bed."
            },
            "construction": {
                "high": "Heavy demolition rubble. Deploy hydraulic tipper truck and tractor loader. Require safety boots, dust masks, and clear pedestrian walkway immediately.",
                "medium": "Clear masonry bricks and cracked tiles. Transport to local C&D recycling processing plant.",
                "low": "Stack reusable bricks neatly and sweep fine mortar dust."
            },
            "near_water": {
                "high": "Critical waterway choke. Deploy water trash boom barriers and floating rakes. Clear drainage culvert immediately to avoid monsoon flooding.",
                "medium": "Remove floating plastic bottles and debris bags from canal banks. Inspect downstream screen.",
                "low": "Routine watercourse litter clearance along riverbank."
            }
        }
    }

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    with open(MODEL_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(trained_model, f, indent=2)

    print(f"Model training complete! Model weights and vision calibration written to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
