import { Router } from "express";
import { manufacturingService } from "../../services/manufacturing.service";
import { z } from "zod";

const router = Router();

// ============ MATERIALS ============
router.get("/materials", async (req, res, next) => {
  try {
    const materials = await manufacturingService.getMaterials();
    res.json(materials);
  } catch (error) {
    next(error);
  }
});

router.post("/materials", async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string(),
      name: z.string(),
      unit: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const material = await manufacturingService.createMaterial(data);
    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
});

// ============ RECEIPTS ============
router.get("/receipts", async (req, res, next) => {
  try {
    const receipts = await manufacturingService.getReceipts();
    res.json(receipts);
  } catch (error) {
    next(error);
  }
});

router.post("/receipts", async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string(),
      supplierName: z.string().optional(),
      totalAmount: z.number(),
      note: z.string().optional(),
      rolls: z.array(
        z.object({
          materialId: z.string(),
          rollCode: z.string(),
          color: z.string().optional(),
          length: z.number().positive(),
          costPrice: z.number(),
        })
      ),
    });
    const data = schema.parse(req.body);
    // @ts-ignore - admin user from middleware
    const adminId = req.user?.id;
    const receipt = await manufacturingService.createReceipt(
      {
        code: data.code,
        supplierName: data.supplierName,
        totalAmount: data.totalAmount,
        note: data.note,
      },
      data.rolls,
      adminId
    );
    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
});

// ============ ROLLS ============
router.get("/rolls", async (req, res, next) => {
  try {
    const rolls = await manufacturingService.getRolls();
    res.json(rolls);
  } catch (error) {
    next(error);
  }
});

// ============ PRODUCTIONS ============
router.get("/productions", async (req, res, next) => {
  try {
    const productions = await manufacturingService.getProductions();
    res.json(productions);
  } catch (error) {
    next(error);
  }
});

router.post("/productions", async (req, res, next) => {
  try {
    const schema = z.object({
      code: z.string(),
      rollId: z.string(),
      usedLength: z.number(),
      wastedLength: z.number().optional(),
      additionalCostPerItem: z.number().optional(),
      additionalCostNote: z.string().optional(),
      note: z.string().optional(),
      items: z.array(
        z.object({
          variantId: z.string(),
          yieldQuantity: z.number().min(1),
        })
      ).min(1),
    });
    const data = schema.parse(req.body);
    // @ts-ignore - admin user from middleware
    const adminId = req.user?.id;
    const production = await manufacturingService.createProductionBatch(
      {
        code: data.code,
        rollId: data.rollId,
        usedLength: data.usedLength,
        wastedLength: data.wastedLength,
        additionalCostPerItem: data.additionalCostPerItem,
        additionalCostNote: data.additionalCostNote,
        note: data.note,
      },
      data.items,
      adminId
    );
    res.status(201).json(production);
  } catch (error) {
    next(error);
  }
});

export default router;
