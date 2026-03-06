<?php

namespace App\Http\Controllers\Api;

use App\Models\Unit;
use Illuminate\Http\JsonResponse;

class UnitController extends BaseApiController
{
    /**
     * GET /api/v1/units
     * Lista todas las unidades disponibles.
     */
    public function index(): JsonResponse
    {
        $units = Unit::orderBy('name')->get();

        return $this->success($units);
    }
}
