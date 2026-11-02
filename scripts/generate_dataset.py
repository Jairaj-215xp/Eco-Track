import os
import json
import random
import math
import numpy as np
import cv2

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

BEFORE_DIR = os.path.join("public", "dataset", "before_cleanup")
AFTER_DIR = os.path.join("public", "dataset", "after_cleanup")
METADATA_PATH = os.path.join("public", "dataset", "dataset_metadata.json")

os.makedirs(BEFORE_DIR, exist_ok=True)
os.makedirs(AFTER_DIR, exist_ok=True)

WIDTH, HEIGHT = 480, 360

ENVIRONMENTS = [
    {
        "env": "urban_street",
        "name": "Urban Street & Roadside",
        "count": 20,
        "primary_types": ["plastic", "household"],
        "items_pool": [
            "Polythene carry bags & pouches",
            "Crinkled food & snack wrappers",
            "Discarded PET plastic bottles & caps",
            "Single-use tea paper cups",
            "Plastic milk pouches",
            "Tobacco & gutkha foil sachets"
        ],
        "recommendation": "Deploy mechanized road sweeping; install segregated dry waste bins; sanitize roadside perimeter."
    },
    {
        "env": "residential_alley",
        "name": "Residential Society & Alleys",
        "count": 20,
        "primary_types": ["household", "plastic", "organic"],
        "items_pool": [
            "Mixed domestic kitchen waste",
            "Cardboard delivery cartons",
            "Polythene trash bags",
            "Discarded egg trays & cartons",
            "Food takeaway packaging & containers",
            "Aluminum drink cans"
        ],
        "recommendation": "Deploy municipal door-to-door garbage collection vehicle; sanitize society gate perimeter; penalize open dumping."
    },
    {
        "env": "waterfront_canal",
        "name": "Waterfront, Canal & Drain Inlet",
        "count": 15,
        "primary_types": ["near_water", "plastic"],
        "items_pool": [
            "Floating polythene bags choking canal",
            "Drifting PET bottles & plastic jugs",
            "Thermocol styrofoam packaging blocks",
            "Discarded textile scraps & rags",
            "Storm drainage runoff debris"
        ],
        "recommendation": "Deploy floating boom barriers and drainage trash rakes; dredge blocked canal culvert immediately to prevent monsoon waterlogging."
    },
    {
        "env": "park_greenery",
        "name": "Public Park & Botanical Belt",
        "count": 15,
        "primary_types": ["plastic", "organic", "household"],
        "items_pool": [
            "Picnic snack packets & wrappers",
            "Discarded juice & water bottles",
            "Decaying garden leaf litter & twigs",
            "Disposable plastic cups & straw",
            "Rotting fruit peels & food residue"
        ],
        "recommendation": "Dispatch botanical garden cleanup squad; compost organic leaf residue locally; install park litter bins every 50 meters."
    },
    {
        "env": "commercial_market",
        "name": "Commercial Market & Mandi Lane",
        "count": 15,
        "primary_types": ["organic", "household", "plastic"],
        "items_pool": [
            "Rotting vegetable scraps & fruit peelings",
            "Crushed wooden & cardboard produce crates",
            "Discarded plastic netting & sack ties",
            "Oil-stained paper & newspaper sweepings",
            "Crushed beverage cans & tetrapaks"
        ],
        "recommendation": "High-pressure water washing of market lane; divert wet vegetable waste to decentralized bio-methanation / composting facility."
    },
    {
        "env": "construction_site",
        "name": "Construction & Renovation Perimeter",
        "count": 15,
        "primary_types": ["construction", "household"],
        "items_pool": [
            "Broken terracotta bricks & masonry chunks",
            "Cracked concrete tiles & plaster rubble",
            "Torn HDPE cement bags & plastic wraps",
            "Mortar dust & gravel heaps",
            "Discarded renovation ceramic fragments"
        ],
        "recommendation": "Deploy heavy hydraulic tipper truck; enforce construction debris netting; restore pedestrian pavement clearance."
    }
]

def generate_background(env_type):
    """Generates realistic synthetic backgrounds for each environment."""
    img = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)

    if env_type == "urban_street":
        # Dark asphalt road with aggregate noise
        asphalt = np.random.normal(70, 8, (HEIGHT, WIDTH)).astype(np.uint8)
        img[:, :] = cv2.merge([asphalt, asphalt, asphalt + 2])
        # Pavement curb at the top
        curb_y = int(HEIGHT * 0.28)
        img[0:curb_y, :] = (120, 125, 128)
        # Curb edge line
        cv2.line(img, (0, curb_y), (WIDTH, curb_y), (155, 160, 165), 3)
        # Broken yellow/white road line
        cv2.line(img, (int(WIDTH * 0.1), int(HEIGHT * 0.85)), (int(WIDTH * 0.4), int(HEIGHT * 0.85)), (210, 210, 210), 4)
        cv2.line(img, (int(WIDTH * 0.6), int(HEIGHT * 0.85)), (int(WIDTH * 0.9), int(HEIGHT * 0.85)), (210, 210, 210), 4)

    elif env_type == "residential_alley":
        # Paver blocks / textured concrete
        base = np.random.normal(130, 10, (HEIGHT, WIDTH)).astype(np.uint8)
        img[:, :] = cv2.merge([base - 5, base, base + 5])
        # Brick wall at top/left
        wall_h = int(HEIGHT * 0.35)
        for y in range(0, wall_h, 16):
            cv2.line(img, (0, y), (WIDTH, y), (85, 95, 130), 1)
        for x in range(0, WIDTH, 36):
            cv2.line(img, (x, 0), (x, wall_h), (85, 95, 130), 1)
        cv2.line(img, (0, wall_h), (WIDTH, wall_h), (60, 70, 95), 3)

    elif env_type == "waterfront_canal":
        # Upper portion: concrete bank / soil
        bank_h = int(HEIGHT * 0.40)
        soil = np.random.normal(90, 12, (bank_h, WIDTH)).astype(np.uint8)
        img[0:bank_h, :] = cv2.merge([soil, soil + 10, soil + 15])
        # Canal water lower portion with shimmer
        water = np.zeros((HEIGHT - bank_h, WIDTH, 3), dtype=np.uint8)
        for y in range(HEIGHT - bank_h):
            depth_factor = y / (HEIGHT - bank_h)
            b = int(140 + 40 * depth_factor)
            g = int(110 + 20 * depth_factor)
            r = int(50 + 15 * depth_factor)
            water[y, :] = (b, g, r)
        # Water ripples
        noise = np.random.normal(0, 8, (HEIGHT - bank_h, WIDTH)).astype(np.int16)
        water = np.clip(water.astype(np.int16) + cv2.merge([noise, noise, noise]), 0, 255).astype(np.uint8)
        img[bank_h:HEIGHT, :] = water
        cv2.line(img, (0, bank_h), (WIDTH, bank_h), (70, 85, 100), 3)

    elif env_type == "park_greenery":
        # Green lawn with natural grass variations
        base_g = np.random.normal(95, 12, (HEIGHT, WIDTH)).astype(np.uint8)
        base_r = np.random.normal(45, 8, (HEIGHT, WIDTH)).astype(np.uint8)
        base_b = np.random.normal(35, 7, (HEIGHT, WIDTH)).astype(np.uint8)
        img[:, :] = cv2.merge([base_b, base_g, base_r])
        # Footpath curve
        pts = np.array([[int(WIDTH * 0.7), 0], [WIDTH, 0], [WIDTH, HEIGHT], [int(WIDTH * 0.45), HEIGHT]], np.int32)
        cv2.fillPoly(img, [pts], (115, 130, 145))

    elif env_type == "commercial_market":
        # Paved stone floor with stains
        base = np.random.normal(110, 14, (HEIGHT, WIDTH)).astype(np.uint8)
        img[:, :] = cv2.merge([base, base + 2, base + 4])
        # Market drain channel
        cv2.rectangle(img, (0, int(HEIGHT * 0.75)), (WIDTH, int(HEIGHT * 0.88)), (75, 80, 85), -1)
        for x in range(10, WIDTH, 24):
            cv2.line(img, (x, int(HEIGHT * 0.76)), (x, int(HEIGHT * 0.87)), (40, 45, 50), 3)

    elif env_type == "construction_site":
        # Earthy dirt and gravel ground
        base = np.random.normal(90, 15, (HEIGHT, WIDTH)).astype(np.uint8)
        img[:, :] = cv2.merge([base - 10, base + 5, base + 20])
        # Foundation concrete wall at top
        cv2.rectangle(img, (0, 0), (WIDTH, int(HEIGHT * 0.25)), (110, 115, 118), -1)
        cv2.line(img, (0, int(HEIGHT * 0.25)), (WIDTH, int(HEIGHT * 0.25)), (70, 75, 78), 3)

    return img

def generate_organic_polygon(center_x, center_y, radius, num_points=12, irregularity=0.35):
    """Generates an organic, non-conventional smooth polygon contour."""
    points = []
    angle_step = (2 * math.pi) / num_points
    for i in range(num_points):
        angle = i * angle_step + random.uniform(-0.15, 0.15)
        # Irregular radial distance gives natural organic mound shapes (circular, oval, or kidney-shaped)
        r = radius * (1.0 + random.uniform(-irregularity, irregularity))
        px = int(center_x + r * math.cos(angle))
        py = int(center_y + r * math.sin(angle))
        px = max(5, min(WIDTH - 5, px))
        py = max(5, min(HEIGHT - 5, py))
        points.append([px, py])
    return np.array(points, dtype=np.int32)

def draw_garbage_cluster(img, polygon, waste_type):
    """Renders realistic multi-material garbage clusters inside organic polygon boundaries."""
    # 1. Soft contact shadow under the cluster
    shadow_poly = polygon + np.array([4, 6], dtype=np.int32)
    overlay = img.copy()
    cv2.fillPoly(overlay, [shadow_poly], (20, 20, 20))
    cv2.addWeighted(overlay, 0.45, img, 0.55, 0, img)

    # 2. Base filling according to waste type
    mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    cv2.fillPoly(mask, [polygon], 255)

    x, y, w, h = cv2.boundingRect(polygon)

    # Sub-elements within the cluster (bottles, bags, wrappers, cartons)
    num_sub_items = random.randint(8, 22)
    for _ in range(num_sub_items):
        sub_cx = random.randint(x + 5, max(x + 6, x + w - 5))
        sub_cy = random.randint(y + 5, max(y + 6, y + h - 5))
        if cv2.pointPolygonTest(polygon, (sub_cx, sub_cy), False) >= 0:
            sub_w = random.randint(8, 28)
            sub_h = random.randint(8, 24)

            if waste_type == "plastic":
                # Vibrant plastic bags, orange flour pouches, translucent white bags, blue bottle caps
                colors = [
                    (30, 110, 240),   # Bright Orange (BGR)
                    (210, 80, 40),    # Bright Blue
                    (30, 200, 240),   # Bright Yellow
                    (40, 40, 220),    # Bright Red
                    (230, 230, 235),  # White Polythene Bag
                    (35, 35, 35)      # Black Polybag
                ]
                c = random.choice(colors)
                sub_pts = generate_organic_polygon(sub_cx, sub_cy, random.randint(6, 16), num_points=7, irregularity=0.4)
                cv2.fillPoly(img, [sub_pts], c)
                # Wrinkle lines & specular reflection
                cv2.polylines(img, [sub_pts], True, (min(255, c[0]+30), min(255, c[1]+30), min(255, c[2]+30)), 1)
                if random.random() > 0.5:
                    cv2.circle(img, (sub_cx, sub_cy), 2, (255, 255, 255), -1)

            elif waste_type == "household":
                # Cardboard cartons (beige/brown), tin cans, wrappers, white paper scraps
                colors = [
                    (65, 125, 175),   # Kraft Cardboard Brown (BGR)
                    (90, 145, 195),   # Light Cardboard Tan
                    (180, 180, 185),  # Tin Can Silver
                    (220, 225, 230),  # White Packaging
                    (40, 90, 190),    # Red/Orange Packet
                    (140, 60, 40)     # Blue Box
                ]
                c = random.choice(colors)
                # Cardboard boxes often have rectangular or folded flaps
                if random.random() > 0.5:
                    angle = random.randint(-40, 40)
                    rect = ((sub_cx, sub_cy), (sub_w, sub_h), angle)
                    box = cv2.boxPoints(rect).astype(np.int32)
                    cv2.fillPoly(img, [box], c)
                    cv2.polylines(img, [box], True, (max(0, c[0]-25), max(0, c[1]-25), max(0, c[2]-25)), 1)
                else:
                    sub_pts = generate_organic_polygon(sub_cx, sub_cy, random.randint(7, 18), num_points=8)
                    cv2.fillPoly(img, [sub_pts], c)

            elif waste_type == "organic":
                # Green leaves, vegetable peelings, dark compost decomposition
                colors = [
                    (35, 115, 65),    # Vegetable Green
                    (45, 145, 95),    # Leaf Green
                    (35, 80, 120),    # Rotten Fruit Brown
                    (40, 165, 210),   # Banana Peel Yellow
                    (25, 45, 55)      # Moist Compost Soil
                ]
                c = random.choice(colors)
                sub_pts = generate_organic_polygon(sub_cx, sub_cy, random.randint(6, 16), num_points=8, irregularity=0.45)
                cv2.fillPoly(img, [sub_pts], c)

            elif waste_type == "construction":
                # Broken red bricks, grey concrete chunks, ceramic tiles
                colors = [
                    (45, 70, 175),    # Terracotta Brick Red (BGR)
                    (55, 85, 195),    # Red Brick Fragment
                    (130, 135, 138),  # Cement Mortar Block
                    (95, 100, 105),   # Heavy Concrete Chunk
                    (165, 170, 175)   # Broken Tile
                ]
                c = random.choice(colors)
                # Sharp angular fractured polygons for masonry
                sub_pts = generate_organic_polygon(sub_cx, sub_cy, random.randint(8, 22), num_points=6, irregularity=0.5)
                cv2.fillPoly(img, [sub_pts], c)
                cv2.polylines(img, [sub_pts], True, (max(0, c[0]-35), max(0, c[1]-35), max(0, c[2]-35)), 2)

            elif waste_type == "near_water":
                # Floating debris, PET bottles, soggy polythene
                colors = [
                    (215, 215, 220),  # White Styrofoam / Polybag
                    (185, 95, 45),    # Blue Water Bottle
                    (35, 130, 230),   # Orange Wrapper
                    (70, 85, 90)      # Soggy Debris
                ]
                c = random.choice(colors)
                sub_pts = generate_organic_polygon(sub_cx, sub_cy, random.randint(6, 17), num_points=8)
                cv2.fillPoly(img, [sub_pts], c)

    return img

def main():
    print(f"Generating 100 Paired Before & After Cleanup Scenes into {BEFORE_DIR} and {AFTER_DIR}...")
    metadata = []
    global_idx = 1

    for env_cfg in ENVIRONMENTS:
        env_type = env_cfg["env"]
        env_name = env_cfg["name"]
        count = env_cfg["count"]

        for local_i in range(count):
            scene_id = f"scene_{global_idx:03d}"
            waste_type = random.choice(env_cfg["primary_types"])

            # 1. Generate Clean "After" Background
            after_img = generate_background(env_type)

            # 2. Clone background to make "Before" Image with organic garbage clusters
            before_img = after_img.copy()

            # Determine number of organic garbage clusters (1 to 4 distinct organic mounds)
            num_clusters = random.randint(1, 4)
            cluster_polygons = []
            total_cluster_area = 0

            for c_i in range(num_clusters):
                cx = random.randint(int(WIDTH * 0.22), int(WIDTH * 0.78))
                cy = random.randint(int(HEIGHT * 0.38), int(HEIGHT * 0.78))
                radius = random.randint(30, 70)

                polygon = generate_organic_polygon(cx, cy, radius, num_points=random.randint(10, 16), irregularity=random.uniform(0.3, 0.45))
                area = cv2.contourArea(polygon)
                total_cluster_area += area
                cluster_polygons.append(polygon.tolist())

                # Render multi-material realistic garbage inside this organic polygon
                draw_garbage_cluster(before_img, polygon, waste_type)

            # Calculate debris coverage percentage
            total_pixels = WIDTH * HEIGHT
            raw_coverage = (total_cluster_area / total_pixels) * 100
            coverage_pct = round(min(88.0, max(14.0, raw_coverage * 1.15)), 1)

            # Severity based on coverage
            if coverage_pct > 45 or waste_type == "near_water":
                severity = "high"
            elif coverage_pct > 25:
                severity = "medium"
            else:
                severity = "low"

            # Cleanliness scores (calibrated ground truth)
            before_cleanliness = max(10, round(100 - (coverage_pct * 1.1) + random.uniform(-3, 3)))
            after_cleanliness = min(98, round(92 + random.uniform(0, 6)))

            # Sample 3-4 specific detected items from environment pool
            sample_count = min(len(env_cfg["items_pool"]), random.randint(3, 4))
            detected_items = random.sample(env_cfg["items_pool"], sample_count)

            # Save Images
            before_filename = f"{scene_id}_before.jpg"
            after_filename = f"{scene_id}_after.jpg"

            before_path = os.path.join(BEFORE_DIR, before_filename)
            after_path = os.path.join(AFTER_DIR, after_filename)

            cv2.imwrite(before_path, before_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
            cv2.imwrite(after_path, after_img, [cv2.IMWRITE_JPEG_QUALITY, 92])

            metadata.append({
                "sceneId": scene_id,
                "environment": env_type,
                "environmentName": env_name,
                "wasteType": waste_type,
                "severity": severity,
                "coveragePercent": coverage_pct,
                "clustersCount": num_clusters,
                "polygons": cluster_polygons,
                "detectedItems": detected_items,
                "beforeCleanlinessScore": before_cleanliness,
                "afterCleanlinessScore": after_cleanliness,
                "aiRecommendation": env_cfg["recommendation"],
                "beforeImagePath": f"/dataset/before_cleanup/{before_filename}",
                "afterImagePath": f"/dataset/after_cleanup/{after_filename}"
            })

            global_idx += 1

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Successfully generated {len(metadata)} paired Before & After cleanup scenes and saved metadata to {METADATA_PATH}!")

if __name__ == "__main__":
    main()
